from pydantic import BaseModel


class WardSummary(BaseModel):
    id: int
    name: str
    code: str
    population: int | None
    registered_voters: int | None

    model_config = {"from_attributes": True}


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
    demographics: list[DemographicResponse]
    infrastructure: list[InfrastructureResponse]
    schemes: list[SchemeResponse]
