from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.api.deps import require_roles
from app.core.database import get_db_session
from app.data.municipal_layers import CITY_BY_ID, MUNICIPAL_LAYERS
from app.models import User, Ward
from app.schemas.constituency import (
    CityListResponse,
    CitySummary,
    DemographicResponse,
    InfrastructureResponse,
    SchemeResponse,
    WardBoundariesResponse,
    WardBoundaryResponse,
    WardDetailResponse,
    WardListResponse,
    WardResolveResponse,
    WardSummary,
)
from app.services.ward_geo import resolve_ward_for_point, ward_to_geojson_feature

router = APIRouter(prefix="/constituency", tags=["constituency"])


@router.get("/cities", response_model=CityListResponse)
async def list_cities(
    current_user: User = Depends(require_roles("leader", "staff", "citizen")),
    session: AsyncSession = Depends(get_db_session),
) -> CityListResponse:
    counts = dict(
        (await session.execute(select(Ward.city, func.count()).group_by(Ward.city))).all()
    )
    cities = [
        CitySummary(
            city=layer.city,
            display_name=layer.display_name,
            default_lat=layer.default_lat,
            default_lng=layer.default_lng,
            default_zoom=layer.default_zoom,
            ward_count=int(counts.get(layer.city, 0)),
        )
        for layer in MUNICIPAL_LAYERS
        if counts.get(layer.city, 0) > 0
    ]
    return CityListResponse(cities=cities)


@router.get("/wards/resolve", response_model=WardResolveResponse)
async def resolve_ward(
    latitude: float = Query(..., ge=-90, le=90),
    longitude: float = Query(..., ge=-180, le=180),
    city: str | None = Query(None),
    current_user: User = Depends(require_roles("leader", "staff", "citizen")),
    session: AsyncSession = Depends(get_db_session),
) -> WardResolveResponse:
    query = select(Ward).order_by(Ward.code)
    if city:
        if city not in CITY_BY_ID:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Unknown city")
        query = query.where(Ward.city == city)

    wards = list((await session.scalars(query)).all())
    result = resolve_ward_for_point(latitude, longitude, wards)
    if result is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No ward found for this location",
        )

    ward = result.ward
    return WardResolveResponse(
        ward_id=ward.id,
        name=ward.name,
        code=ward.code,
        city=ward.city,
        municipal_ward_number=ward.municipal_ward_number,
        ward_area_name=ward.ward_area_name,
        confidence=result.confidence,  # type: ignore[arg-type]
        distance_m=result.distance_m,
    )


@router.get("/ward-boundaries", response_model=WardBoundariesResponse)
async def list_ward_boundaries(
    city: str | None = Query(None),
    current_user: User = Depends(require_roles("leader", "staff", "citizen")),
    session: AsyncSession = Depends(get_db_session),
) -> WardBoundariesResponse:
    query = select(Ward).order_by(Ward.code)
    if city:
        if city not in CITY_BY_ID:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Unknown city")
        query = query.where(Ward.city == city)

    wards = list((await session.scalars(query)).all())
    features = [
        feature
        for ward in wards
        if (feature := ward_to_geojson_feature(ward)) is not None
    ]
    return WardBoundariesResponse(features=features)


@router.get("/wards/{ward_id}/boundary", response_model=WardBoundaryResponse)
async def get_ward_boundary(
    ward_id: int,
    current_user: User = Depends(require_roles("leader", "staff", "citizen")),
    session: AsyncSession = Depends(get_db_session),
) -> WardBoundaryResponse:
    ward = await session.scalar(select(Ward).where(Ward.id == ward_id))
    if ward is None or not ward.boundary_geojson:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Ward boundary not found")

    import json

    geometry = json.loads(ward.boundary_geojson)
    return WardBoundaryResponse(
        ward_id=ward.id,
        code=ward.code,
        name=ward.name,
        city=ward.city,
        geometry=geometry,
        centroid_lat=ward.centroid_lat,
        centroid_lng=ward.centroid_lng,
    )


@router.get("/wards", response_model=WardListResponse)
async def list_wards(
    city: str | None = Query(None),
    current_user: User = Depends(require_roles("leader", "staff", "citizen")),
    session: AsyncSession = Depends(get_db_session),
) -> WardListResponse:
    query = select(Ward).order_by(Ward.city, Ward.code)
    if city:
        if city not in CITY_BY_ID:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Unknown city")
        query = query.where(Ward.city == city)

    wards = list((await session.scalars(query)).all())
    total_population = sum((ward.population or 0) for ward in wards)
    total_voters = sum((ward.registered_voters or 0) for ward in wards)
    constituency_name = (
        CITY_BY_ID[city].constituency_name
        if city and city in CITY_BY_ID
        else (wards[0].constituency_name if wards else "South Delhi")
    )

    return WardListResponse(
        constituency_name=constituency_name,
        total_population=int(total_population or 0),
        total_registered_voters=int(total_voters or 0),
        wards=[WardSummary.from_ward(ward) for ward in wards],
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
        municipal_ward_number=ward.municipal_ward_number,
        ward_area_name=ward.ward_area_name,
        centroid_lat=ward.centroid_lat,
        centroid_lng=ward.centroid_lng,
        has_boundary=bool(ward.boundary_geojson),
        demographics=[DemographicResponse.model_validate(item) for item in ward.demographics],
        infrastructure=[InfrastructureResponse.model_validate(item) for item in ward.infrastructure],
        schemes=[SchemeResponse.model_validate(item) for item in ward.schemes],
    )
