from pydantic import BaseModel, Field


# ---- Weekly briefing ----
class BriefingRequest(BaseModel):
    constituency_name: str
    period_start: str
    period_end: str
    totals: dict = Field(default_factory=dict)
    wards: list[dict] = Field(default_factory=list)


class BriefingResponse(BaseModel):
    headline: str
    summary: str
    highlights: list[str]
    risks: list[str]
    recommendations: list[str]


# ---- Priority explanations ----
class PriorityInsightInput(BaseModel):
    id: str
    rank: int | None = None
    title: str
    ward_name: str | None = None
    category: str | None = None
    source_type: str | None = None
    score: float | None = None
    reasons: list[str] = Field(default_factory=list)


class PriorityInsightsRequest(BaseModel):
    constituency_name: str
    priorities: list[PriorityInsightInput]


class PriorityInsightItem(BaseModel):
    id: str
    explanation: str
    recommended_action: str


class PriorityInsightsResponse(BaseModel):
    overview: str
    items: list[PriorityInsightItem]


# ---- Complaint themes ----
class ComplaintInput(BaseModel):
    summary: str
    category: str | None = None
    ward_name: str | None = None


class ComplaintThemesRequest(BaseModel):
    constituency_name: str
    period_label: str | None = None
    complaints: list[ComplaintInput]


class ComplaintTheme(BaseModel):
    theme: str
    category: str
    count: int
    summary: str
    severity: str
    wards: list[str]


class ComplaintThemesResponse(BaseModel):
    overview: str
    themes: list[ComplaintTheme]
