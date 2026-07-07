from datetime import date, datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.api.deps import require_roles
from app.core.commitment_weights import compute_commitment_weight
from app.core.database import get_db_session
from app.models import Commitment, Complaint, ComplaintCluster, User, Ward
from app.schemas.digest import DigestResponse, DigestTotals, WardDigestMetrics
from app.schemas.leader_ai import WeeklyBriefingResponse
from app.services.leader_ai import (
    LeaderAIError,
    generate_weekly_briefing,
    leader_ai_configured,
)

router = APIRouter(tags=["digest"])


def parse_date(value: str | None, field_name: str) -> date | None:
    if value is None:
        return None
    try:
        return date.fromisoformat(value)
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"{field_name} must be YYYY-MM-DD",
        ) from exc


def as_utc(value: datetime | None) -> datetime | None:
    if value is None:
        return None
    if value.tzinfo is None:
        return value.replace(tzinfo=timezone.utc)
    return value


@router.get("/digest", response_model=DigestResponse)
async def get_digest(
    period_start: str | None = Query(default=None),
    period_end: str | None = Query(default=None),
    current_user: User = Depends(require_roles("leader", "staff")),
    session: AsyncSession = Depends(get_db_session),
) -> DigestResponse:
    end_day = parse_date(period_end, "period_end") or date.today()
    start_day = parse_date(period_start, "period_start") or (end_day - timedelta(days=6))
    if start_day > end_day:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="period_start must be on or before period_end",
        )

    return await _build_digest(session, start_day, end_day)


async def _build_digest(
    session: AsyncSession,
    start_day: date,
    end_day: date,
) -> DigestResponse:
    start_dt = datetime.combine(start_day, datetime.min.time(), tzinfo=timezone.utc)
    end_dt = datetime.combine(end_day, datetime.max.time(), tzinfo=timezone.utc)

    wards = list(
        (
            await session.scalars(
                select(Ward)
                .options(selectinload(Ward.infrastructure))
                .order_by(Ward.code)
            )
        ).all()
    )
    complaints = list((await session.scalars(select(Complaint))).all())
    clusters = list((await session.scalars(select(ComplaintCluster))).all())
    commitments = list((await session.scalars(select(Commitment))).all())

    period_complaints = []
    for complaint in complaints:
        created_at = as_utc(complaint.created_at)
        if created_at is not None and start_dt <= created_at <= end_dt:
            period_complaints.append(complaint)

    completed_in_period = []
    for commitment in commitments:
        if commitment.status != "completed":
            continue
        updated_at = as_utc(commitment.updated_at)
        if updated_at is not None and start_dt <= updated_at <= end_dt:
            completed_in_period.append(commitment)

    active_commitments = [item for item in commitments if item.status == "active"]
    today = date.today()
    overdue_commitments = [
        item
        for item in active_commitments
        if compute_commitment_weight(item.deadline, today) > 1
    ]

    ward_metrics: list[WardDigestMetrics] = []
    for ward in wards:
        ward_complaints = [item for item in period_complaints if item.ward_id == ward.id]
        category_counts: dict[str, int] = {}
        for complaint in ward_complaints:
            category_counts[complaint.category] = category_counts.get(complaint.category, 0) + 1

        ward_active = [item for item in active_commitments if item.ward_id == ward.id]
        ward_overdue = [item for item in overdue_commitments if item.ward_id == ward.id]
        ward_completed = [item for item in completed_in_period if item.ward_id == ward.id]
        ward_clusters = [item for item in clusters if item.ward_id == ward.id]
        critical_infra = len(
            [item for item in ward.infrastructure if item.status in {"critical", "poor"}]
        )

        ward_metrics.append(
            WardDigestMetrics(
                ward_id=ward.id,
                ward_name=ward.name,
                population=ward.population,
                registered_voters=ward.registered_voters,
                complaints_opened=len(ward_complaints),
                complaints_by_category=category_counts,
                active_commitments=len(ward_active),
                overdue_commitments=len(ward_overdue),
                completed_commitments=len(ward_completed),
                open_clusters=len(ward_clusters),
                critical_infra_alerts=critical_infra,
            )
        )

    totals = DigestTotals(
        complaints_opened=len(period_complaints),
        active_commitments=len(active_commitments),
        overdue_commitments=len(overdue_commitments),
        completed_commitments=len(completed_in_period),
        open_clusters=len(clusters),
        critical_infra_alerts=sum(item.critical_infra_alerts for item in ward_metrics),
        total_population=sum(ward.population or 0 for ward in wards),
        total_registered_voters=sum(ward.registered_voters or 0 for ward in wards),
    )

    constituency_name = wards[0].constituency_name if wards else "South Delhi"
    return DigestResponse(
        constituency_name=constituency_name,
        period_start=start_day.isoformat(),
        period_end=end_day.isoformat(),
        totals=totals,
        wards=ward_metrics,
    )


@router.get("/digest/briefing", response_model=WeeklyBriefingResponse)
async def get_digest_briefing(
    period_start: str | None = Query(default=None),
    period_end: str | None = Query(default=None),
    current_user: User = Depends(require_roles("leader", "staff")),
    session: AsyncSession = Depends(get_db_session),
) -> WeeklyBriefingResponse:
    if not leader_ai_configured():
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Leader AI is not configured on the server",
        )

    end_day = parse_date(period_end, "period_end") or date.today()
    start_day = parse_date(period_start, "period_start") or (end_day - timedelta(days=6))
    if start_day > end_day:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="period_start must be on or before period_end",
        )

    digest = await _build_digest(session, start_day, end_day)

    # Rank wards by activity so the model focuses on real hotspots.
    ranked_wards = sorted(
        digest.wards,
        key=lambda w: (w.complaints_opened, w.overdue_commitments, w.critical_infra_alerts),
        reverse=True,
    )
    payload = {
        "constituency_name": digest.constituency_name,
        "period_start": digest.period_start,
        "period_end": digest.period_end,
        "totals": digest.totals.model_dump(),
        "wards": [
            {
                "ward_name": w.ward_name,
                "complaints_opened": w.complaints_opened,
                "complaints_by_category": w.complaints_by_category,
                "active_commitments": w.active_commitments,
                "overdue_commitments": w.overdue_commitments,
                "completed_commitments": w.completed_commitments,
                "open_clusters": w.open_clusters,
                "critical_infra_alerts": w.critical_infra_alerts,
            }
            for w in ranked_wards[:8]
        ],
    }

    try:
        result = await generate_weekly_briefing(payload)
    except LeaderAIError as exc:
        raise HTTPException(
            status_code=exc.status_code or status.HTTP_502_BAD_GATEWAY,
            detail=str(exc),
        ) from exc

    return WeeklyBriefingResponse(
        constituency_name=digest.constituency_name,
        period_start=digest.period_start,
        period_end=digest.period_end,
        headline=str(result.get("headline", "")),
        summary=str(result.get("summary", "")),
        highlights=list(result.get("highlights", [])),
        risks=list(result.get("risks", [])),
        recommendations=list(result.get("recommendations", [])),
    )
