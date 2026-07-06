from typing import Literal

from pydantic import BaseModel, Field


class WardSummary(BaseModel):
    id: int
    name: str
    code: str
    city: str | None = None
    population: int | None
    registered_voters: int | None
    municipal_ward_number: str | None = None
    ward_area_name: str | None = None
    centroid_lat: float | None = None
    centroid_lng: float | None = None
    has_boundary: bool = False

    model_config = {"from_attributes": True}

    @classmethod
    def from_ward(cls, ward) -> "WardSummary":
        return cls(
            id=ward.id,
            name=ward.name,
            code=ward.code,
            city=ward.city,
            population=ward.population,
            registered_voters=ward.registered_voters,
            municipal_ward_number=ward.municipal_ward_number,
            ward_area_name=ward.ward_area_name,
            centroid_lat=ward.centroid_lat,
            centroid_lng=ward.centroid_lng,
            has_boundary=bool(ward.boundary_geojson),
        )


class DemographicResponse(BaseModel):
    id: str
    ward_id: int
    population: int
    registered_voters: int
    literacy_rate: float | None
    key_indicators: str | None

    model_config = {"from_attributes": True}


class InfrastructureResponse(BaseModel):
    id: str
    ward_id: int
    category: str
    status: str
    description: str

    model_config = {"from_attributes": True}


class SchemeResponse(BaseModel):
    id: str
    ward_id: int
    name: str
    penetration_rate: float | None
    beneficiaries: int | None
    status: str

    model_config = {"from_attributes": True}


class WardListResponse(BaseModel):
    constituency_name: str
    total_population: int
    total_registered_voters: int
    wards: list[WardSummary]


class WardDetailResponse(BaseModel):
    id: int
    name: str
    code: str
    constituency_name: str
    population: int | None
    registered_voters: int | None
    municipal_ward_number: str | None = None
    ward_area_name: str | None = None
    centroid_lat: float | None = None
    centroid_lng: float | None = None
    has_boundary: bool = False
    demographics: list[DemographicResponse]
    infrastructure: list[InfrastructureResponse]
    schemes: list[SchemeResponse]


class WardResolveResponse(BaseModel):
    ward_id: int
    name: str
    code: str
    city: str | None = None
    municipal_ward_number: str | None = None
    ward_area_name: str | None = None
    confidence: Literal["inside", "nearest"]
    distance_m: float | None = None


class WardBoundariesResponse(BaseModel):
    type: str = "FeatureCollection"
    features: list[dict] = Field(default_factory=list)


class WardBoundaryResponse(BaseModel):
    ward_id: int
    code: str
    name: str
    city: str | None = None
    geometry: dict
    centroid_lat: float | None = None
    centroid_lng: float | None = None


class CitySummary(BaseModel):
    city: str
    display_name: str
    default_lat: float
    default_lng: float
    default_zoom: int
    ward_count: int = 0


class CityListResponse(BaseModel):
    cities: list[CitySummary]
