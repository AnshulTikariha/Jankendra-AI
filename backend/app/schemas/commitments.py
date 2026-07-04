from datetime import date

from pydantic import BaseModel, Field


class CommitmentCreateRequest(BaseModel):
    title: str = Field(min_length=1, max_length=255)
    description: str = Field(min_length=1)
    ward_id: int | None = None
    assignee: str | None = None
    deadline: date


class TodoActionRequest(BaseModel):
    action: str = Field(min_length=1, max_length=20)
    new_deadline: date | None = None
    note: str | None = None


class CommitmentResponse(BaseModel):
    id: str
    title: str
    description: str
    ward_id: int | None
    ward_name: str | None
    assignee: str | None
    deadline: str
    weight: int
    weight_tier: str
    status: str
    days_overdue: int
    source_meeting_id: str | None
    created_at: str


class CommitmentListResponse(BaseModel):
    total: int
    commitments: list[CommitmentResponse]


class TodoListResponse(BaseModel):
    total: int
    items: list[CommitmentResponse]
