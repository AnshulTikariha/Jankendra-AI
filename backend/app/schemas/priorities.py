from pydantic import BaseModel


class PriorityItem(BaseModel):
    id: str
    ward_id: int
    ward_name: str
    title: str
    category: str
    source_type: str
    score: float
    rank: int
    reasons: list[str]
    citizen_impact: float
    urgency: float
    commitment_pressure: float
    population_factor: float


class WardPrioritySummary(BaseModel):
    ward_id: int
    ward_name: str
    total_score: float
    open_clusters: int
    open_complaints: int
    overdue_commitments: int
    infra_alerts: int
    population: int | None
    top_action: str | None


class PrioritiesResponse(BaseModel):
    constituency_name: str
    total: int
    priorities: list[PriorityItem]
    ward_comparison: list[WardPrioritySummary]
