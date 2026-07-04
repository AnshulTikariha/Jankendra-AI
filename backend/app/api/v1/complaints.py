from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.api.deps import get_current_user, require_roles
from app.core.database import get_db_session
from app.core.otp import normalize_phone
from app.models import Complaint, ComplaintCluster, User, Ward
from app.schemas.complaints import (
    ALLOWED_CATEGORIES,
    ComplaintCreateRequest,
    ComplaintListResponse,
    ComplaintResponse,
)

router = APIRouter(prefix="/complaints", tags=["complaints"])

DEPARTMENT_BY_CATEGORY = {
    "water": "WMD",
    "roads": "PWD",
    "drainage": "PWD",
    "electricity": "Electricity Dept",
    "health": "Health",
    "sanitation": "WMD",
    "other": "General Administration",
}


def build_complaint_response(
    complaint: Complaint,
    ward_name: str,
    cluster_count: int,
    department_suggestion: str | None,
) -> ComplaintResponse:
    submitted_at = complaint.created_at
    if submitted_at is not None and submitted_at.tzinfo is None:
        submitted_at = submitted_at.replace(tzinfo=timezone.utc)

    return ComplaintResponse(
        id=complaint.id,
        public_reference=complaint.public_reference,
        ward_id=complaint.ward_id,
        ward_name=ward_name,
        category=complaint.category,
        description=complaint.description,
        location_detail=complaint.location_detail,
        status=complaint.status,
        cluster_count=cluster_count,
        source=complaint.source,
        submitted_at=submitted_at.isoformat() if submitted_at else datetime.now(timezone.utc).isoformat(),
        reporter_phone=complaint.citizen_contact,
        department_suggestion=department_suggestion,
    )


async def next_public_reference(session: AsyncSession) -> str:
    year = datetime.now(timezone.utc).year
    prefix = f"JK-{year}-"
    latest = await session.scalar(
        select(Complaint.public_reference)
        .where(Complaint.public_reference.like(f"{prefix}%"))
        .order_by(Complaint.public_reference.desc())
        .limit(1)
    )
    if latest is None:
        return f"{prefix}0001"

    try:
        sequence = int(latest.rsplit("-", maxsplit=1)[-1]) + 1
    except ValueError:
        total = await session.scalar(select(func.count()).select_from(Complaint))
        sequence = int(total or 0) + 1

    return f"{prefix}{sequence:04d}"


async def get_or_create_cluster(
    session: AsyncSession,
    ward_id: int,
    category: str,
) -> ComplaintCluster:
    cluster = await session.scalar(
        select(ComplaintCluster).where(
            ComplaintCluster.ward_id == ward_id,
            ComplaintCluster.category == category,
        )
    )
    department = DEPARTMENT_BY_CATEGORY.get(category, "General Administration")
    if cluster is None:
        cluster = ComplaintCluster(
            ward_id=ward_id,
            label=f"{category.title()} issues",
            category=category,
            citizen_count=1,
            department_suggestion=department,
        )
        session.add(cluster)
        await session.flush()
        return cluster

    cluster.citizen_count += 1
    cluster.department_suggestion = department
    await session.flush()
    return cluster


@router.post("", response_model=ComplaintResponse, status_code=status.HTTP_201_CREATED)
async def create_complaint(
    payload: ComplaintCreateRequest,
    current_user: User = Depends(require_roles("citizen", "staff", "leader")),
    session: AsyncSession = Depends(get_db_session),
) -> ComplaintResponse:
    category = payload.category.strip().lower()
    if category not in ALLOWED_CATEGORIES:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Invalid category",
        )

    ward = await session.scalar(select(Ward).where(Ward.id == payload.ward_id))
    if ward is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Ward not found")

    if current_user.role == "citizen":
        source = "citizen"
        reporter_phone = current_user.phone
    else:
        source = "staff"
        reporter_phone = (
            normalize_phone(payload.citizen_contact)
            if payload.citizen_contact
            else current_user.phone
        )
        if payload.citizen_contact and len(reporter_phone) != 10:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="citizen_contact must be a valid 10-digit phone number",
            )

    cluster = await get_or_create_cluster(session, payload.ward_id, category)
    complaint = Complaint(
        public_reference=await next_public_reference(session),
        ward_id=payload.ward_id,
        description=payload.description.strip(),
        category=category,
        location_detail=payload.location_detail.strip() if payload.location_detail else None,
        citizen_contact=reporter_phone,
        status="submitted",
        source=source,
        cluster_id=cluster.id,
    )
    session.add(complaint)
    await session.commit()
    await session.refresh(complaint)

    return build_complaint_response(
        complaint=complaint,
        ward_name=ward.name,
        cluster_count=cluster.citizen_count,
        department_suggestion=cluster.department_suggestion,
    )


@router.get("", response_model=ComplaintListResponse)
async def list_complaints(
    ward_id: int | None = Query(default=None),
    current_user: User = Depends(require_roles("citizen", "staff", "leader")),
    session: AsyncSession = Depends(get_db_session),
) -> ComplaintListResponse:
    query = (
        select(Complaint)
        .options(selectinload(Complaint.cluster))
        .order_by(Complaint.created_at.desc())
    )

    if current_user.role == "citizen":
        query = query.where(Complaint.citizen_contact == current_user.phone)
    elif ward_id is not None:
        query = query.where(Complaint.ward_id == ward_id)

    complaints = list((await session.scalars(query)).all())
    ward_ids = {item.ward_id for item in complaints}
    wards = {}
    if ward_ids:
        ward_rows = (await session.scalars(select(Ward).where(Ward.id.in_(ward_ids)))).all()
        wards = {ward.id: ward.name for ward in ward_rows}

    items = [
        build_complaint_response(
            complaint=item,
            ward_name=wards.get(item.ward_id, "Unknown"),
            cluster_count=item.cluster.citizen_count if item.cluster else 1,
            department_suggestion=item.cluster.department_suggestion if item.cluster else None,
        )
        for item in complaints
    ]
    return ComplaintListResponse(total=len(items), complaints=items)


@router.get("/{complaint_id}", response_model=ComplaintResponse)
async def get_complaint(
    complaint_id: str,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db_session),
) -> ComplaintResponse:
    if current_user.role not in {"citizen", "staff", "leader"}:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not enough permissions")

    complaint = await session.scalar(
        select(Complaint)
        .where(Complaint.id == complaint_id)
        .options(selectinload(Complaint.cluster))
    )
    if complaint is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Complaint not found")

    if current_user.role == "citizen" and complaint.citizen_contact != current_user.phone:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not enough permissions")

    ward = await session.scalar(select(Ward).where(Ward.id == complaint.ward_id))
    return build_complaint_response(
        complaint=complaint,
        ward_name=ward.name if ward else "Unknown",
        cluster_count=complaint.cluster.citizen_count if complaint.cluster else 1,
        department_suggestion=complaint.cluster.department_suggestion if complaint.cluster else None,
    )
