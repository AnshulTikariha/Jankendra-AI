from datetime import datetime, time, timezone

from sqlalchemy import or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models import Complaint, Ward
from app.services.ward_geo import haversine_m, resolve_ward_for_point


def wards_within_radius_km(
    wards: list[Ward],
    latitude: float,
    longitude: float,
    radius_km: float,
) -> list[Ward]:
    radius_m = radius_km * 1000.0
    nearby: list[tuple[Ward, float]] = []

    for ward in wards:
        if ward.centroid_lat is None or ward.centroid_lng is None:
            continue
        distance_m = haversine_m(latitude, longitude, ward.centroid_lat, ward.centroid_lng)
        if distance_m <= radius_m:
            nearby.append((ward, distance_m))

    nearby.sort(key=lambda item: item[1])
    return [ward for ward, _ in nearby]


def resolve_explore_wards(
    wards: list[Ward],
    latitude: float,
    longitude: float,
    radius_km: float,
) -> tuple[list[Ward], str | None]:
    """Pick wards for community explore: same municipality as GPS, capped by radius."""
    resolved = resolve_ward_for_point(latitude, longitude, wards)
    if resolved is None:
        return wards_within_radius_km(wards, latitude, longitude, radius_km), None

    detected_city = resolved.ward.city
    if not detected_city:
        return wards_within_radius_km(wards, latitude, longitude, radius_km), None

    city_wards = [ward for ward in wards if ward.city == detected_city]
    in_radius = wards_within_radius_km(city_wards, latitude, longitude, radius_km)
    if in_radius:
        return in_radius, detected_city

    # City detected but nothing in radius (edge case) — use full city catalogue.
    return city_wards, detected_city


def complaint_ward_within_radius(
    ward: Ward | None,
    latitude: float,
    longitude: float,
    radius_km: float,
) -> bool:
    if ward is None or ward.centroid_lat is None or ward.centroid_lng is None:
        return False
    radius_m = radius_km * 1000.0
    return haversine_m(latitude, longitude, ward.centroid_lat, ward.centroid_lng) <= radius_m


def parse_date_start(value: datetime) -> datetime:
    if value.tzinfo is None:
        return value.replace(tzinfo=timezone.utc)
    return value


def parse_date_end(value: datetime) -> datetime:
    parsed = parse_date_start(value)
    return datetime.combine(parsed.date(), time(23, 59, 59, 999999), tzinfo=timezone.utc)


async def query_explore_complaints(
    session: AsyncSession,
    *,
    ward_ids: list[int],
    date_from: datetime | None,
    date_to: datetime | None,
    search: str | None,
    limit: int,
) -> list[Complaint]:
    if not ward_ids:
        return []

    query = (
        select(Complaint)
        .where(Complaint.ward_id.in_(ward_ids))
        .options(selectinload(Complaint.cluster))
        .order_by(Complaint.created_at.desc())
        .limit(limit)
    )

    if date_from is not None:
        query = query.where(Complaint.created_at >= parse_date_start(date_from))
    if date_to is not None:
        query = query.where(Complaint.created_at <= parse_date_end(date_to))

    if search:
        term = f"%{search.strip()}%"
        query = query.where(
            or_(
                Complaint.description.ilike(term),
                Complaint.public_reference.ilike(term),
                Complaint.category.ilike(term),
            )
        )

    return list((await session.scalars(query)).all())
