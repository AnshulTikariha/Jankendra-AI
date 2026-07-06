from pydantic import BaseModel, Field


class ComplaintTextAnalysisRequest(BaseModel):
    text: str = Field(..., min_length=1, max_length=5000)


class ComplaintTextAnalysisResponse(BaseModel):
    categories: list[str]
    sentiment: str
    severity: str
    location: str | None
    summary: str
    keywords: list[str]
