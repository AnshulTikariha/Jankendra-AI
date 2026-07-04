from pydantic import BaseModel, Field


class OtpRequest(BaseModel):
    phone: str = Field(min_length=10, max_length=15)


class OtpRequestResponse(BaseModel):
    message: str
    phone: str
    expires_in_seconds: int
    dev_otp: str | None = None


class OtpVerifyRequest(BaseModel):
    phone: str = Field(min_length=10, max_length=15)
    otp: str = Field(min_length=4, max_length=8)
    role: str = Field(min_length=1, max_length=20)


class UserResponse(BaseModel):
    id: str
    phone: str
    full_name: str
    role: str
    is_active: bool
    constituency_name: str = "South Delhi"

    model_config = {"from_attributes": True}


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse
