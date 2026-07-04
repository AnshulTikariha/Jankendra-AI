from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.api.deps import require_roles
from app.core.database import get_db_session
from app.models import User, Ward
from app.schemas.constituency import (
    DemographicResponse,
    InfrastructureResponse,
    SchemeResponse,
    WardDetailResponse,
    WardListResponse,
    WardSummary,
)

router = APIRouter(prefix="/constituency", tags=["constituency"])


@router.get("/wards", response_model=WardListResponse)
async def list_wards(
    current_user: User = Depends(require_roles("leader", "staff")),
    session: AsyncSession = Depends(get_db_session),
) -> WardListResponse:
    wards = list((await session.scalars(select(Ward).order_by(Ward.code))).all())
    total_population = await session.scalar(select(func.coalesce(func.sum(Ward.population), 0)))
    total_voters = await session.scalar(select(func.coalesce(func.sum(Ward.registered_voters), 0)))
    constituency_name = wards[0].constituency_name if wards else "South Delhi"

    return WardListResponse(
        constituency_name=constituency_name,
        total_population=int(total_population or 0),
        total_registered_voters=int(total_voters or 0),
        wards=[WardSummary.model_validate(ward) for ward in wards],
    )


@router.get("/wards/{ward_id}", response_model=WardDetailResponse)
async def get_ward(
    ward_id: int,
    current_user: User = Depends(require_roles("leader", "staff")),
    session: AsyncSession = Depends(get_db_session),
) -> WardDetailResponse:
    ward = await session.scalar(
        select(Ward)
        .where(Ward.id == ward_id)
        .options(
            selectinload(Ward.demographics),
            selectinload(Ward.infrastructure),
            selectinload(Ward.schemes),
        )
    )
    if ward is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Ward not found")

    return WardDetailResponse(
        id=ward.id,
        name=ward.name,
        code=ward.code,
        constituency_name=ward.constituency_name,
        population=ward.population,
        registered_voters=ward.registered_voters,
        demographics=[DemographicResponse.model_validate(item) for item in ward.demographics],
        infrastructure=[InfrastructureResponse.model_validate(item) for item in ward.infrastructure],
        schemes=[SchemeResponse.model_validate(item) for item in ward.schemes],
    )
