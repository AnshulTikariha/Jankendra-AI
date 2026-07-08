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

ALLOWED_STATUSES = {
    "submitted",
    "under_review",
    "in_progress",
    "resolved",
}


class ComplaintCreateRequest(BaseModel):
    ward_id: int
    category: str = Field(min_length=1, max_length=100)
    description: str = Field(min_length=1)
    location_detail: str | None = None
    citizen_contact: str | None = None


class ComplaintUpdateRequest(BaseModel):
    status: str | None = None
    assigned_department: str | None = Field(default=None, max_length=100)
    staff_note: str | None = Field(default=None, max_length=2000)


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
    updated_at: str | None = None
    reporter_phone: str | None
    department_suggestion: str | None
    assigned_department: str | None = None
    staff_note: str | None = None


class ComplaintListResponse(BaseModel):
    total: int
    complaints: list[ComplaintResponse]
