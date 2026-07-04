import json
from datetime import date, datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.api.deps import require_roles
from app.core.commitment_weights import compute_commitment_weight, days_overdue
from app.core.database import get_db_session
from app.models import Commitment, CommitmentHistory, ResolvedCommitment, User, Ward
from app.schemas.commitments import (
    CommitmentCreateRequest,
    CommitmentListResponse,
    CommitmentResponse,
    TodoActionRequest,
    TodoListResponse,
)

router = APIRouter(tags=["commitments"])


def format_datetime(value: datetime | None) -> str:
    if value is None:
        return datetime.now(timezone.utc).isoformat()
    if value.tzinfo is None:
        value = value.replace(tzinfo=timezone.utc)
    return value.isoformat()


def build_commitment_response(
    commitment: Commitment,
    ward_name: str | None,
    today: date | None = None,
) -> CommitmentResponse:
    current_day = today or date.today()
    weight = compute_commitment_weight(commitment.deadline, current_day)
    overdue = days_overdue(commitment.deadline, current_day)
    return CommitmentResponse(
        id=commitment.id,
        title=commitment.title,
        description=commitment.description,
        ward_id=commitment.ward_id,
        ward_name=ward_name,
        assignee=commitment.assignee,
        deadline=commitment.deadline.isoformat(),
        weight=weight,
        weight_tier=f"W{weight}",
        status=commitment.status,
        days_overdue=overdue,
        source_meeting_id=commitment.source_meeting_id,
        created_at=format_datetime(commitment.created_at),
    )


async def load_ward_names(session: AsyncSession, ward_ids: set[int]) -> dict[int, str]:
    if not ward_ids:
        return {}
    wards = (await session.scalars(select(Ward).where(Ward.id.in_(ward_ids)))).all()
    return {ward.id: ward.name for ward in wards}


async def refresh_active_weights(session: AsyncSession, commitments: list[Commitment]) -> None:
    today = date.today()
    changed = False
    for commitment in commitments:
        if commitment.status != "active":
            continue
        new_weight = compute_commitment_weight(commitment.deadline, today)
        if commitment.weight != new_weight:
            old_weight = commitment.weight
            commitment.weight = new_weight
            session.add(
                CommitmentHistory(
                    commitment_id=commitment.id,
                    action="escalated",
                    old_weight=old_weight,
                    new_weight=new_weight,
                    note="Weight refreshed from overdue ladder",
                )
            )
            changed = True
    if changed:
        await session.commit()
        for commitment in commitments:
            await session.refresh(commitment)


@router.get("/todo", response_model=TodoListResponse)
async def list_todo(
    current_user: User = Depends(require_roles("leader", "staff")),
    session: AsyncSession = Depends(get_db_session),
) -> TodoListResponse:
    commitments = list(
        (
            await session.scalars(
                select(Commitment)
                .where(Commitment.status == "active")
                .options(selectinload(Commitment.history))
            )
        ).all()
    )
    await refresh_active_weights(session, commitments)

    ward_names = await load_ward_names(
        session,
        {item.ward_id for item in commitments if item.ward_id is not None},
    )
    today = date.today()
    items = [
        build_commitment_response(
            commitment=item,
            ward_name=ward_names.get(item.ward_id) if item.ward_id is not None else None,
            today=today,
        )
        for item in commitments
    ]
    items.sort(key=lambda row: (row.weight, row.days_overdue), reverse=True)
    return TodoListResponse(total=len(items), items=items)


@router.patch("/todo/{commitment_id}", response_model=CommitmentResponse)
async def update_todo_item(
    commitment_id: str,
    payload: TodoActionRequest,
    current_user: User = Depends(require_roles("leader", "staff")),
    session: AsyncSession = Depends(get_db_session),
) -> CommitmentResponse:
    action = payload.action.strip().lower()
    if action not in {"complete", "extend"}:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="action must be complete or extend",
        )

    commitment = await session.scalar(
        select(Commitment)
        .where(Commitment.id == commitment_id)
        .options(selectinload(Commitment.history))
    )
    if commitment is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Commitment not found")
    if commitment.status != "active":
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Only active commitments can be updated",
        )

    if action == "extend":
        if payload.new_deadline is None:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="new_deadline is required for extend",
            )
        if payload.new_deadline <= commitment.deadline:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="new_deadline must be after the current deadline",
            )

        old_deadline = commitment.deadline
        old_weight = commitment.weight
        commitment.deadline = payload.new_deadline
        commitment.weight = compute_commitment_weight(payload.new_deadline)
        session.add(
            CommitmentHistory(
                commitment_id=commitment.id,
                action="extended",
                old_deadline=old_deadline,
                new_deadline=payload.new_deadline,
                old_weight=old_weight,
                new_weight=commitment.weight,
                note=payload.note,
            )
        )
        await session.commit()
        await session.refresh(commitment)

        ward_name = None
        if commitment.ward_id is not None:
            ward = await session.scalar(select(Ward).where(Ward.id == commitment.ward_id))
            ward_name = ward.name if ward else None
        return build_commitment_response(commitment, ward_name)

    history_snapshot = [
        {
            "action": item.action,
            "old_deadline": item.old_deadline.isoformat() if item.old_deadline else None,
            "new_deadline": item.new_deadline.isoformat() if item.new_deadline else None,
            "old_weight": item.old_weight,
            "new_weight": item.new_weight,
            "note": item.note,
            "created_at": format_datetime(item.created_at),
        }
        for item in commitment.history
    ]
    completed_at = datetime.now(timezone.utc)
    session.add(
        ResolvedCommitment(
            original_commitment_id=commitment.id,
            title=commitment.title,
            description=commitment.description,
            ward_id=commitment.ward_id,
            assignee=commitment.assignee,
            deadline=commitment.deadline,
            completed_at=completed_at,
            history_snapshot=json.dumps(history_snapshot),
        )
    )
    session.add(
        CommitmentHistory(
            commitment_id=commitment.id,
            action="completed",
            old_weight=commitment.weight,
            new_weight=commitment.weight,
            note=payload.note or f"Completed by {current_user.full_name}",
        )
    )
    commitment.status = "completed"
    await session.commit()
    await session.refresh(commitment)

    ward_name = None
    if commitment.ward_id is not None:
        ward = await session.scalar(select(Ward).where(Ward.id == commitment.ward_id))
        ward_name = ward.name if ward else None
    return build_commitment_response(commitment, ward_name)


@router.get("/commitments", response_model=CommitmentListResponse)
async def list_commitments(
    status_filter: str = Query(default="all", alias="status"),
    current_user: User = Depends(require_roles("leader", "staff")),
    session: AsyncSession = Depends(get_db_session),
) -> CommitmentListResponse:
    status_value = status_filter.strip().lower()
    if status_value not in {"all", "active", "completed"}:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="status must be all, active, or completed",
        )

    query = select(Commitment).order_by(Commitment.deadline.asc())
    if status_value != "all":
        query = query.where(Commitment.status == status_value)

    commitments = list((await session.scalars(query)).all())
    active_items = [item for item in commitments if item.status == "active"]
    await refresh_active_weights(session, active_items)

    ward_names = await load_ward_names(
        session,
        {item.ward_id for item in commitments if item.ward_id is not None},
    )
    today = date.today()
    items = [
        build_commitment_response(
            commitment=item,
            ward_name=ward_names.get(item.ward_id) if item.ward_id is not None else None,
            today=today,
        )
        for item in commitments
    ]
    if status_value == "active":
        items.sort(key=lambda row: (row.weight, row.days_overdue), reverse=True)

    return CommitmentListResponse(total=len(items), commitments=items)


@router.post("/commitments", response_model=CommitmentResponse, status_code=status.HTTP_201_CREATED)
async def create_commitment(
    payload: CommitmentCreateRequest,
    current_user: User = Depends(require_roles("leader", "staff")),
    session: AsyncSession = Depends(get_db_session),
) -> CommitmentResponse:
    ward_name = None
    if payload.ward_id is not None:
        ward = await session.scalar(select(Ward).where(Ward.id == payload.ward_id))
        if ward is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Ward not found")
        ward_name = ward.name

    weight = compute_commitment_weight(payload.deadline)
    commitment = Commitment(
        title=payload.title.strip(),
        description=payload.description.strip(),
        ward_id=payload.ward_id,
        assignee=payload.assignee.strip() if payload.assignee else current_user.full_name,
        deadline=payload.deadline,
        weight=weight,
        status="active",
    )
    session.add(commitment)
    await session.flush()
    session.add(
        CommitmentHistory(
            commitment_id=commitment.id,
            action="created",
            new_deadline=payload.deadline,
            new_weight=weight,
            note=f"Created by {current_user.full_name}",
        )
    )
    await session.commit()
    await session.refresh(commitment)
    return build_commitment_response(commitment, ward_name)
