from pydantic import BaseModel


class WeeklyBriefingResponse(BaseModel):
    constituency_name: str
    period_start: str
    period_end: str
    headline: str
    summary: str
    highlights: list[str]
    risks: list[str]
    recommendations: list[str]


class PriorityInsightItem(BaseModel):
    id: str
    explanation: str
    recommended_action: str


class PriorityInsightsResponse(BaseModel):
    overview: str
    items: list[PriorityInsightItem]


class ComplaintTheme(BaseModel):
    theme: str
    category: str
    count: int
    summary: str
    severity: str
    wards: list[str]


class ComplaintThemesResponse(BaseModel):
    overview: str
    period_label: str
    total_complaints: int
    themes: list[ComplaintTheme]
