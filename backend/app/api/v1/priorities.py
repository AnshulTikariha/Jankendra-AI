from datetime import date

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.api.deps import require_roles
from app.core.commitment_weights import compute_commitment_weight
from app.core.database import get_db_session
from app.models import Commitment, Complaint, ComplaintCluster, User, Ward
from app.schemas.leader_ai import PriorityInsightItem, PriorityInsightsResponse
from app.schemas.priorities import PrioritiesResponse, PriorityItem, WardPrioritySummary
from app.services.leader_ai import (
    LeaderAIError,
    generate_priority_insights,
    leader_ai_configured,
)

router = APIRouter(tags=["priorities"])

INFRA_URGENCY = {"critical": 15.0, "poor": 8.0, "fair": 3.0, "good": 0.0}


@router.get("/priorities", response_model=PrioritiesResponse)
async def list_priorities(
    ward_id: int | None = Query(default=None),
    limit: int = Query(default=20, ge=1, le=100),
    current_user: User = Depends(require_roles("leader", "staff")),
    session: AsyncSession = Depends(get_db_session),
) -> PrioritiesResponse:
    return await _build_priorities(session, ward_id, limit)


async def _build_priorities(
    session: AsyncSession,
    ward_id: int | None,
    limit: int,
) -> PrioritiesResponse:
    wards = list(
        (
            await session.scalars(
                select(Ward)
                .options(selectinload(Ward.infrastructure))
                .order_by(Ward.code)
            )
        ).all()
    )
    if ward_id is not None:
        wards = [ward for ward in wards if ward.id == ward_id]
        if not wards:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Ward not found")

    ward_by_id = {ward.id: ward for ward in wards}
    ward_ids = set(ward_by_id.keys())

    clusters = list((await session.scalars(select(ComplaintCluster))).all())
    complaints = list((await session.scalars(select(Complaint))).all())
    commitments = list(
        (await session.scalars(select(Commitment).where(Commitment.status == "active"))).all()
    )

    if ward_id is not None:
        clusters = [item for item in clusters if item.ward_id == ward_id]
        complaints = [item for item in complaints if item.ward_id == ward_id]
        commitments = [item for item in commitments if item.ward_id == ward_id]

    today = date.today()
    priorities: list[PriorityItem] = []

    for cluster in clusters:
        ward = ward_by_id.get(cluster.ward_id)
        if ward is None:
            continue
        population = ward.population or 0
        citizen_impact = float(cluster.citizen_count) * 10.0
        urgency = 5.0 if cluster.citizen_count >= 3 else 2.0
        commitment_pressure = 0.0
        population_factor = population / 10000.0
        score = citizen_impact + urgency + population_factor
        reasons = [
            f"{cluster.citizen_count} related complaints in cluster",
            f"Department suggestion: {cluster.department_suggestion or 'General'}",
            f"Ward population factor: {population}",
        ]
        priorities.append(
            PriorityItem(
                id=cluster.id,
                ward_id=ward.id,
                ward_name=ward.name,
                title=cluster.label,
                category=cluster.category or "other",
                source_type="complaint_cluster",
                score=round(score, 2),
                rank=0,
                reasons=reasons,
                citizen_impact=round(citizen_impact, 2),
                urgency=round(urgency, 2),
                commitment_pressure=round(commitment_pressure, 2),
                population_factor=round(population_factor, 2),
            )
        )

    for ward in wards:
        for item in ward.infrastructure:
            urgency = INFRA_URGENCY.get(item.status, 0.0)
            if urgency <= 0:
                continue
            population = ward.population or 0
            citizen_impact = population / 20000.0
            population_factor = population / 10000.0
            score = urgency + citizen_impact + population_factor
            reasons = [
                f"Infrastructure status is {item.status}",
                f"Category: {item.category}",
                f"Affects estimated ward population {population}",
            ]
            priorities.append(
                PriorityItem(
                    id=item.id,
                    ward_id=ward.id,
                    ward_name=ward.name,
                    title=item.description,
                    category=item.category,
                    source_type="infrastructure",
                    score=round(score, 2),
                    rank=0,
                    reasons=reasons,
                    citizen_impact=round(citizen_impact, 2),
                    urgency=round(urgency, 2),
                    commitment_pressure=0.0,
                    population_factor=round(population_factor, 2),
                )
            )

    for commitment in commitments:
        ward = ward_by_id.get(commitment.ward_id) if commitment.ward_id is not None else None
        if commitment.ward_id is not None and ward is None:
            continue
        weight = compute_commitment_weight(commitment.deadline, today)
        commitment_pressure = float(weight) * 5.0
        urgency = float(weight) * 2.0
        population = ward.population if ward and ward.population else 0
        population_factor = population / 10000.0
        citizen_impact = 3.0 if weight >= 3 else 1.0
        score = commitment_pressure + urgency + population_factor + citizen_impact
        ward_id = ward.id if ward else 0
        ward_name = ward.name if ward else "Constituency"
        reasons = [
            f"Commitment weight tier W{weight}",
            f"Deadline {commitment.deadline.isoformat()}",
            f"Assignee: {commitment.assignee or 'Unassigned'}",
        ]
        priorities.append(
            PriorityItem(
                id=commitment.id,
                ward_id=ward_id,
                ward_name=ward_name,
                title=commitment.title,
                category="commitment",
                source_type="commitment",
                score=round(score, 2),
                rank=0,
                reasons=reasons,
                citizen_impact=round(citizen_impact, 2),
                urgency=round(urgency, 2),
                commitment_pressure=round(commitment_pressure, 2),
                population_factor=round(population_factor, 2),
            )
        )

    priorities.sort(key=lambda row: row.score, reverse=True)
    priorities = priorities[:limit]
    for index, item in enumerate(priorities, start=1):
        item.rank = index

    complaint_counts: dict[int, int] = {}
    for complaint in complaints:
        if complaint.ward_id in ward_ids:
            complaint_counts[complaint.ward_id] = complaint_counts.get(complaint.ward_id, 0) + 1

    cluster_counts: dict[int, int] = {}
    for cluster in clusters:
        if cluster.ward_id in ward_ids:
            cluster_counts[cluster.ward_id] = cluster_counts.get(cluster.ward_id, 0) + 1

    overdue_counts: dict[int, int] = {}
    for commitment in commitments:
        if commitment.ward_id is None or commitment.ward_id not in ward_ids:
            continue
        if compute_commitment_weight(commitment.deadline, today) > 1:
            overdue_counts[commitment.ward_id] = overdue_counts.get(commitment.ward_id, 0) + 1

    ward_comparison: list[WardPrioritySummary] = []
    for ward in wards:
        infra_alerts = len(
            [item for item in ward.infrastructure if item.status in {"critical", "poor"}]
        )
        ward_priorities = [item for item in priorities if item.ward_id == ward.id]
        total_score = sum(item.score for item in ward_priorities)
        top_action = ward_priorities[0].title if ward_priorities else None
        ward_comparison.append(
            WardPrioritySummary(
                ward_id=ward.id,
                ward_name=ward.name,
                total_score=round(total_score, 2),
                open_clusters=cluster_counts.get(ward.id, 0),
                open_complaints=complaint_counts.get(ward.id, 0),
                overdue_commitments=overdue_counts.get(ward.id, 0),
                infra_alerts=infra_alerts,
                population=ward.population,
                top_action=top_action,
            )
        )
    ward_comparison.sort(key=lambda row: row.total_score, reverse=True)

    constituency_name = wards[0].constituency_name if wards else "South Delhi"
    return PrioritiesResponse(
        constituency_name=constituency_name,
        total=len(priorities),
        priorities=priorities,
        ward_comparison=ward_comparison,
    )


@router.get("/priorities/insights", response_model=PriorityInsightsResponse)
async def get_priority_insights(
    ward_id: int | None = Query(default=None),
    limit: int = Query(default=20, ge=1, le=100),
    current_user: User = Depends(require_roles("leader", "staff")),
    session: AsyncSession = Depends(get_db_session),
) -> PriorityInsightsResponse:
    if not leader_ai_configured():
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Leader AI is not configured on the server",
        )

    data = await _build_priorities(session, ward_id, limit)
    if not data.priorities:
        return PriorityInsightsResponse(overview="", items=[])

    payload = {
        "constituency_name": data.constituency_name,
        "priorities": [
            {
                "id": item.id,
                "rank": item.rank,
                "title": item.title,
                "ward_name": item.ward_name,
                "category": item.category,
                "source_type": item.source_type,
                "score": item.score,
                "reasons": item.reasons,
            }
            for item in data.priorities
        ],
    }

    try:
        result = await generate_priority_insights(payload)
    except LeaderAIError as exc:
        raise HTTPException(
            status_code=exc.status_code or status.HTTP_502_BAD_GATEWAY,
            detail=str(exc),
        ) from exc

    items: list[PriorityInsightItem] = []
    for item in result.get("items", []):
        if not isinstance(item, dict):
            continue
        item_id = str(item.get("id", "")).strip()
        if not item_id:
            continue
        items.append(
            PriorityInsightItem(
                id=item_id,
                explanation=str(item.get("explanation", "")),
                recommended_action=str(item.get("recommended_action", "")),
            )
        )

    return PriorityInsightsResponse(overview=str(result.get("overview", "")), items=items)
