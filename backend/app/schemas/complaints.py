from pydantic import BaseModel, Field


ALLOWED_CATEGORIES = {
    "water",
    "roads",
    "drainage",
    "electricity",
    "health",
    "sanitation",
    "other",
}


class ComplaintCreateRequest(BaseModel):
    ward_id: int
    category: str = Field(min_length=1, max_length=100)
    description: str = Field(min_length=1)
    location_detail: str | None = None
    citizen_contact: str | None = None


class ComplaintResponse(BaseModel):
    id: str
    public_reference: str
    ward_id: int
    ward_name: str
    ward_code: str | None = None
    category: str
    description: str
    location_detail: str | None
    status: str
    cluster_count: int
    source: str
    submitted_at: str
    reporter_phone: str | None
    department_suggestion: str | None


class ComplaintListResponse(BaseModel):
    total: int
    complaints: list[ComplaintResponse]
