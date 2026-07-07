from pydantic import BaseModel


class HotWard(BaseModel):
    id: str
    name: str


class DashboardKpis(BaseModel):
    open_complaints: int
    open_complaints_trend: int
    active_commitments: int
    overdue_commitments: int
    resolved_this_week: int
    on_time_rate_pct: int
    citizen_complaints_week: int
    hot_ward: HotWard


class PriorityItem(BaseModel):
    id: str
    type: str
    title: str
    ward_name: str
    weight: int
    source: str | None = None


class CommitmentAtRisk(BaseModel):
    id: str
    title: str
    ward_name: str
    deadline: str
    weight_tier: str
    days_overdue: int


class WardComparisonRow(BaseModel):
    ward_id: str
    ward_name: str
    open_clusters: int
    open_complaints: int
    overdue_commitments: int
    infra_alerts: list[str]


class RecentActivityItem(BaseModel):
    id: str
    timestamp: str
    type: str
    summary: str
    ward_name: str


class DashboardResponse(BaseModel):
    constituency_name: str
    kpis: DashboardKpis
    priorities: list[PriorityItem]
    commitments_at_risk: list[CommitmentAtRisk]
    ward_comparison: list[WardComparisonRow]
    recent_activity: list[RecentActivityItem]
