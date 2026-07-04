from pydantic import BaseModel


class DigestTotals(BaseModel):
    complaints_opened: int
    active_commitments: int
    overdue_commitments: int
    completed_commitments: int
    open_clusters: int
    critical_infra_alerts: int
    total_population: int
    total_registered_voters: int


class WardDigestMetrics(BaseModel):
    ward_id: int
    ward_name: str
    population: int | None
    registered_voters: int | None
    complaints_opened: int
    complaints_by_category: dict[str, int]
    active_commitments: int
    overdue_commitments: int
    completed_commitments: int
    open_clusters: int
    critical_infra_alerts: int


class DigestResponse(BaseModel):
    constituency_name: str
    period_start: str
    period_end: str
    totals: DigestTotals
    wards: list[WardDigestMetrics]
