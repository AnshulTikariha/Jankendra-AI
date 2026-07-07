from datetime import datetime, timedelta, timezone

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
from app.schemas.complaint_analysis import (
    ComplaintTextAnalysisRequest,
    ComplaintTextAnalysisResponse,
)
from app.schemas.leader_ai import ComplaintTheme, ComplaintThemesResponse
from app.services.complaint_explore import (
    query_explore_complaints,
    resolve_explore_wards,
)
from app.services.complaint_text_analysis import (
    ComplaintAnalysisError,
    analyze_complaint_text,
    complaint_analysis_configured,
)
from app.services.leader_ai import (
    LeaderAIError,
    generate_complaint_themes,
    leader_ai_configured,
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
    ward_code: str | None,
    cluster_count: int,
    department_suggestion: str | None,
    *,
    redact_contact: bool = False,
) -> ComplaintResponse:
    submitted_at = complaint.created_at
    if submitted_at is not None and submitted_at.tzinfo is None:
        submitted_at = submitted_at.replace(tzinfo=timezone.utc)

    return ComplaintResponse(
        id=complaint.id,
        public_reference=complaint.public_reference,
        ward_id=complaint.ward_id,
        ward_name=ward_name,
        ward_code=ward_code,
        category=complaint.category,
        description=complaint.description,
        location_detail=complaint.location_detail,
        status=complaint.status,
        cluster_count=cluster_count,
        source=complaint.source,
        submitted_at=submitted_at.isoformat() if submitted_at else datetime.now(timezone.utc).isoformat(),
        reporter_phone=None if redact_contact else complaint.citizen_contact,
        department_suggestion=department_suggestion,
    )


async def load_ward_map(session: AsyncSession, ward_ids: set[int]) -> dict[int, Ward]:
    if not ward_ids:
        return {}
    ward_rows = (await session.scalars(select(Ward).where(Ward.id.in_(ward_ids)))).all()
    return {ward.id: ward for ward in ward_rows}


def complaint_to_response(complaint: Complaint, wards: dict[int, Ward], *, redact_contact: bool = False) -> ComplaintResponse:
    ward = wards.get(complaint.ward_id)
    return build_complaint_response(
        complaint=complaint,
        ward_name=ward.name if ward else "Unknown",
        ward_code=ward.code if ward else None,
        cluster_count=complaint.cluster.citizen_count if complaint.cluster else 1,
        department_suggestion=complaint.cluster.department_suggestion if complaint.cluster else None,
        redact_contact=redact_contact,
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
        ward_code=ward.code,
        cluster_count=cluster.citizen_count,
        department_suggestion=cluster.department_suggestion,
    )


@router.post("/analyze-text", response_model=ComplaintTextAnalysisResponse)
async def analyze_complaint_text_route(
    payload: ComplaintTextAnalysisRequest,
    current_user: User = Depends(require_roles("citizen", "staff", "leader")),
) -> ComplaintTextAnalysisResponse:
    if not complaint_analysis_configured():
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Complaint text analysis is not configured on the server",
        )

    try:
        result = await analyze_complaint_text(payload.text)
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        ) from exc
    except FileNotFoundError as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Google credentials are not configured for text analysis",
        ) from exc
    except ComplaintAnalysisError as exc:
        raise HTTPException(
            status_code=exc.status_code or status.HTTP_502_BAD_GATEWAY,
            detail=str(exc),
        ) from exc
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Text analysis failed: {exc}",
        ) from exc

    return ComplaintTextAnalysisResponse(
        categories=list(result.categories),
        sentiment=result.sentiment,
        severity=result.severity,
        location=result.location,
        summary=result.summary,
        keywords=result.keywords,
    )


def _complaint_body(description: str) -> str:
    """Return the human-written complaint text without the metadata block."""
    body = description.split("\n---\n")[0].strip()
    return body[:500]


@router.get("/themes", response_model=ComplaintThemesResponse)
async def complaint_themes_route(
    days: int = Query(default=14, ge=1, le=90),
    limit: int = Query(default=120, ge=1, le=300),
    current_user: User = Depends(require_roles("leader", "staff")),
    session: AsyncSession = Depends(get_db_session),
) -> ComplaintThemesResponse:
    if not leader_ai_configured():
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Leader AI is not configured on the server",
        )

    now = datetime.now(timezone.utc)
    window_start = now - timedelta(days=days)
    period_label = f"Last {days} days"

    wards = list((await session.scalars(select(Ward))).all())
    ward_names = {ward.id: ward.name for ward in wards}
    constituency_name = wards[0].constituency_name if wards else "South Delhi"

    complaints = list(
        (
            await session.scalars(select(Complaint).order_by(Complaint.created_at.desc()))
        ).all()
    )
    recent: list[Complaint] = []
    for complaint in complaints:
        created = complaint.created_at
        if created is not None and created.tzinfo is None:
            created = created.replace(tzinfo=timezone.utc)
        if created is not None and created < window_start:
            continue
        recent.append(complaint)
        if len(recent) >= limit:
            break

    if not recent:
        return ComplaintThemesResponse(
            overview="No recent complaints in this period.",
            period_label=period_label,
            total_complaints=0,
            themes=[],
        )

    payload = {
        "constituency_name": constituency_name,
        "period_label": period_label,
        "complaints": [
            {
                "summary": _complaint_body(complaint.description),
                "category": complaint.category,
                "ward_name": ward_names.get(complaint.ward_id, "Unknown"),
            }
            for complaint in recent
        ],
    }

    try:
        result = await generate_complaint_themes(payload)
    except LeaderAIError as exc:
        raise HTTPException(
            status_code=exc.status_code or status.HTTP_502_BAD_GATEWAY,
            detail=str(exc),
        ) from exc

    themes: list[ComplaintTheme] = []
    for theme in result.get("themes", []):
        if not isinstance(theme, dict):
            continue
        themes.append(
            ComplaintTheme(
                theme=str(theme.get("theme", "")),
                category=str(theme.get("category", "other")),
                count=int(theme.get("count", 0) or 0),
                summary=str(theme.get("summary", "")),
                severity=str(theme.get("severity", "medium")),
                wards=[str(w) for w in theme.get("wards", []) if str(w).strip()],
            )
        )

    return ComplaintThemesResponse(
        overview=str(result.get("overview", "")),
        period_label=period_label,
        total_complaints=len(recent),
        themes=themes,
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
    wards: dict[int, Ward] = {}
    if ward_ids:
        ward_rows = (await session.scalars(select(Ward).where(Ward.id.in_(ward_ids)))).all()
        wards = {ward.id: ward for ward in ward_rows}

    items = [
        build_complaint_response(
            complaint=item,
            ward_name=wards[item.ward_id].name if item.ward_id in wards else "Unknown",
            ward_code=wards[item.ward_id].code if item.ward_id in wards else None,
            cluster_count=item.cluster.citizen_count if item.cluster else 1,
            department_suggestion=item.cluster.department_suggestion if item.cluster else None,
        )
        for item in complaints
    ]
    return ComplaintListResponse(total=len(items), complaints=items)


@router.get("/explore", response_model=ComplaintListResponse)
async def explore_complaints(
    latitude: float = Query(..., ge=-90, le=90),
    longitude: float = Query(..., ge=-180, le=180),
    radius_km: float = Query(default=50, ge=1, le=100),
    ward_id: int | None = Query(default=None),
    date_from: datetime | None = Query(default=None),
    date_to: datetime | None = Query(default=None),
    q: str | None = Query(default=None, max_length=200),
    limit: int = Query(default=60, ge=1, le=200),
    current_user: User = Depends(require_roles("citizen", "staff", "leader")),
    session: AsyncSession = Depends(get_db_session),
) -> ComplaintListResponse:
    all_wards = list((await session.scalars(select(Ward))).all())
    nearby_wards, _detected_city = resolve_explore_wards(
        all_wards, latitude, longitude, radius_km
    )
    nearby_ids = {ward.id for ward in nearby_wards}

    if ward_id is not None:
        if ward_id not in nearby_ids:
            return ComplaintListResponse(total=0, complaints=[])
        target_ward_ids = [ward_id]
    else:
        target_ward_ids = list(nearby_ids)

    complaints = await query_explore_complaints(
        session,
        ward_ids=target_ward_ids,
        date_from=date_from,
        date_to=date_to,
        search=q,
        limit=limit,
    )

    ward_map = {ward.id: ward for ward in nearby_wards}
    if ward_id is not None:
        extra = await session.scalar(select(Ward).where(Ward.id == ward_id))
        if extra is not None:
            ward_map[extra.id] = extra

    items = [complaint_to_response(item, ward_map, redact_contact=current_user.role == "citizen") for item in complaints]
    return ComplaintListResponse(total=len(items), complaints=items)


@router.get("/explore/{complaint_id}", response_model=ComplaintResponse)
async def get_explore_complaint(
    complaint_id: str,
    latitude: float = Query(..., ge=-90, le=90),
    longitude: float = Query(..., ge=-180, le=180),
    radius_km: float = Query(default=50, ge=1, le=100),
    current_user: User = Depends(require_roles("citizen", "staff", "leader")),
    session: AsyncSession = Depends(get_db_session),
) -> ComplaintResponse:
    complaint = await session.scalar(
        select(Complaint)
        .where(Complaint.id == complaint_id)
        .options(selectinload(Complaint.cluster))
    )
    if complaint is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Complaint not found")

    ward = await session.scalar(select(Ward).where(Ward.id == complaint.ward_id))
    if ward is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Complaint ward not found")

    all_wards = list((await session.scalars(select(Ward))).all())
    explore_wards, _ = resolve_explore_wards(all_wards, latitude, longitude, radius_km)
    explore_ids = {item.id for item in explore_wards}
    if complaint.ward_id not in explore_ids:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Complaint is outside your search area",
        )

    ward_map = await load_ward_map(session, {complaint.ward_id})
    return complaint_to_response(
        complaint,
        ward_map,
        redact_contact=current_user.role == "citizen" and complaint.citizen_contact != current_user.phone,
    )


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
        ward_code=ward.code if ward else None,
        cluster_count=complaint.cluster.citizen_count if complaint.cluster else 1,
        department_suggestion=complaint.cluster.department_suggestion if complaint.cluster else None,
    )
