from pydantic import BaseModel, Field


class TextAnalysisRequest(BaseModel):
    text: str = Field(
        ...,
        min_length=1,
        max_length=5000,
        description="Complaint or issue paragraph to analyze.",
    )


class TextAnalysisResponse(BaseModel):
    categories: list[str]
    sentiment: str
    severity: str
    location: str | None
    summary: str
    keywords: list[str]
