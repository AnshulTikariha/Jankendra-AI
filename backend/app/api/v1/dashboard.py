from datetime import datetime, timezone

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.api.deps import require_roles
from app.core.database import get_db_session
from app.models import Commitment, Complaint, Infrastructure, User, Ward
from app.schemas.dashboard import (
    CommitmentAtRisk,
    DashboardKpis,
    DashboardResponse,
    HotWard,
    PriorityItem,
    RecentActivityItem,
    WardComparisonRow,
)

router = APIRouter(tags=["dashboard"])

ALERT_STATUSES = {"critical", "poor"}
STATUS_WEIGHT = {"critical": 10, "poor": 6, "fair": 3, "good": 1}


@router.get("/dashboard", response_model=DashboardResponse)
async def get_dashboard(
    current_user: User = Depends(require_roles("leader", "staff")),
    session: AsyncSession = Depends(get_db_session),
) -> DashboardResponse:
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
    commitments = list((await session.scalars(select(Commitment))).all())

    constituency_name = wards[0].constituency_name if wards else "South Delhi"
    ward_by_id = {ward.id: ward for ward in wards}

    open_complaints = len(complaints)
    active_commitments = len([item for item in commitments if item.status == "active"])
    today = datetime.now(timezone.utc).date()
    overdue_commitments = [
        item
        for item in commitments
        if item.status == "active" and item.deadline < today
    ]

    alert_items: list[tuple[Ward, Infrastructure]] = []
    for ward in wards:
        for item in ward.infrastructure:
            if item.status in ALERT_STATUSES:
                alert_items.append((ward, item))

    hot_ward = HotWard(id="", name="")
    if alert_items:
        alert_counts: dict[int, int] = {}
        for ward, _item in alert_items:
            alert_counts[ward.id] = alert_counts.get(ward.id, 0) + 1
        hot_ward_id = max(alert_counts, key=alert_counts.get)
        hot = ward_by_id[hot_ward_id]
        hot_ward = HotWard(id=str(hot.id), name=hot.name)
    elif wards:
        hot_ward = HotWard(id=str(wards[0].id), name=wards[0].name)

    priorities: list[PriorityItem] = []
    for ward, item in alert_items:
        priorities.append(
            PriorityItem(
                id=item.id,
                type="complaint",
                title=item.description,
                ward_name=ward.name,
                weight=STATUS_WEIGHT.get(item.status, 1),
                source="staff",
            )
        )
    priorities.sort(key=lambda row: row.weight, reverse=True)

    for commitment in overdue_commitments:
        ward_name = ward_by_id[commitment.ward_id].name if commitment.ward_id in ward_by_id else "Unknown"
        priorities.append(
            PriorityItem(
                id=commitment.id,
                type="commitment",
                title=commitment.title,
                ward_name=ward_name,
                weight=commitment.weight,
                source=None,
            )
        )

    commitments_at_risk: list[CommitmentAtRisk] = []
    for commitment in overdue_commitments:
        ward_name = ward_by_id[commitment.ward_id].name if commitment.ward_id in ward_by_id else "Unknown"
        days_overdue = (today - commitment.deadline).days
        commitments_at_risk.append(
            CommitmentAtRisk(
                id=commitment.id,
                title=commitment.title,
                ward_name=ward_name,
                deadline=commitment.deadline.isoformat(),
                weight_tier=f"W{commitment.weight}",
                days_overdue=days_overdue,
            )
        )

    ward_comparison: list[WardComparisonRow] = []
    for ward in wards:
        infra_alerts = [
            f"{item.category}:{item.status}"
            for item in ward.infrastructure
            if item.status in ALERT_STATUSES
        ]
        ward_overdue = len(
            [
                item
                for item in overdue_commitments
                if item.ward_id == ward.id
            ]
        )
        ward_comparison.append(
            WardComparisonRow(
                ward_id=str(ward.id),
                ward_name=ward.name,
                open_clusters=0,
                overdue_commitments=ward_overdue,
                infra_alerts=infra_alerts,
            )
        )

    recent_activity: list[RecentActivityItem] = []
    for ward, item in alert_items[:10]:
        recent_activity.append(
            RecentActivityItem(
                id=item.id,
                timestamp=datetime.now(timezone.utc).isoformat(),
                type="staff_complaint",
                summary=item.description,
                ward_name=ward.name,
            )
        )

    proxy_open_issues = open_complaints if open_complaints > 0 else len(alert_items)

    return DashboardResponse(
        constituency_name=constituency_name,
        kpis=DashboardKpis(
            open_complaints=proxy_open_issues,
            open_complaints_trend=0,
            active_commitments=active_commitments,
            overdue_commitments=len(overdue_commitments),
            resolved_this_week=0,
            on_time_rate_pct=100 if not overdue_commitments else 0,
            citizen_complaints_week=0,
            hot_ward=hot_ward,
        ),
        priorities=priorities,
        commitments_at_risk=commitments_at_risk,
        ward_comparison=ward_comparison,
        recent_activity=recent_activity,
    )
