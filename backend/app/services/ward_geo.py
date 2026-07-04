import json
import math
from dataclasses import dataclass

from shapely.geometry import Point, shape
from shapely.geometry.base import BaseGeometry

from app.models import Ward


@dataclass(frozen=True)
class WardResolveResult:
    ward: Ward
    confidence: str
    distance_m: float | None = None


def _parse_geometry(geojson_text: str) -> BaseGeometry:
    payload = json.loads(geojson_text)
    if payload.get("type") == "Feature":
        return shape(payload["geometry"])
    return shape(payload)


def geometry_from_geojson(geojson_text: str) -> BaseGeometry:
    return _parse_geometry(geojson_text)


def compute_centroid(geojson_text: str) -> tuple[float, float]:
    geometry = _parse_geometry(geojson_text)
    centroid = geometry.centroid
    return centroid.y, centroid.x


def haversine_m(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
    radius = 6371000.0
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    d_phi = math.radians(lat2 - lat1)
    d_lambda = math.radians(lng2 - lng1)
    a = math.sin(d_phi / 2) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(d_lambda / 2) ** 2
    return radius * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))


def resolve_ward_for_point(
    latitude: float,
    longitude: float,
    wards: list[Ward],
) -> WardResolveResult | None:
    if not wards:
        return None

    point = Point(longitude, latitude)
    containing: list[Ward] = []

    for ward in wards:
        if not ward.boundary_geojson:
            continue
        geometry = _parse_geometry(ward.boundary_geojson)
        if geometry.contains(point) or geometry.touches(point):
            containing.append(ward)

    if containing:
        ward = sorted(containing, key=lambda item: item.code)[0]
        return WardResolveResult(ward=ward, confidence="inside", distance_m=0.0)

    nearest: Ward | None = None
    nearest_distance: float | None = None

    for ward in wards:
        if ward.centroid_lat is None or ward.centroid_lng is None:
            continue
        distance = haversine_m(latitude, longitude, ward.centroid_lat, ward.centroid_lng)
        if nearest_distance is None or distance < nearest_distance:
            nearest = ward
            nearest_distance = distance

    if nearest is None or nearest_distance is None:
        return None

    return WardResolveResult(
        ward=nearest,
        confidence="nearest",
        distance_m=round(nearest_distance, 1),
    )


def ward_to_geojson_feature(ward: Ward) -> dict | None:
    if not ward.boundary_geojson:
        return None

    geometry = json.loads(ward.boundary_geojson)
    return {
        "type": "Feature",
        "properties": {
            "ward_id": ward.id,
            "name": ward.name,
            "code": ward.code,
            "municipal_ward_number": ward.municipal_ward_number,
            "ward_area_name": ward.ward_area_name,
        },
        "geometry": geometry,
    }
