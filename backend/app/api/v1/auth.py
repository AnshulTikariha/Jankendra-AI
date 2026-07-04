from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user
from app.core.config import settings
from app.core.database import get_db_session
from app.core.otp import (
    ALLOWED_ROLES,
    OTP_EXPIRE_MINUTES,
    create_otp_challenge,
    is_valid_phone,
    normalize_phone,
    verify_otp_challenge,
)
from app.core.security import create_access_token
from app.models import User
from app.schemas.auth import (
    OtpRequest,
    OtpRequestResponse,
    OtpVerifyRequest,
    TokenResponse,
    UserResponse,
)

router = APIRouter(prefix="/auth", tags=["auth"])


def build_user_response(user: User) -> UserResponse:
    return UserResponse(
        id=user.id,
        phone=user.phone,
        full_name=user.full_name,
        role=user.role,
        is_active=user.is_active,
        constituency_name="South Delhi",
    )


@router.post("/otp/request", response_model=OtpRequestResponse)
async def request_otp(
    payload: OtpRequest,
    session: AsyncSession = Depends(get_db_session),
) -> OtpRequestResponse:
    phone = normalize_phone(payload.phone)
    if not is_valid_phone(phone):
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Phone must be a valid 10-digit Indian mobile number",
        )

    user = await session.scalar(select(User).where(User.phone == phone))
    if user is None or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Phone number is not registered",
        )

    dev_otp = create_otp_challenge(phone)
    response = OtpRequestResponse(
        message="OTP sent successfully",
        phone=phone,
        expires_in_seconds=OTP_EXPIRE_MINUTES * 60,
    )
    if settings.environment == "development":
        response.dev_otp = dev_otp
    return response


@router.post("/otp/verify", response_model=TokenResponse)
async def verify_otp(
    payload: OtpVerifyRequest,
    session: AsyncSession = Depends(get_db_session),
) -> TokenResponse:
    phone = normalize_phone(payload.phone)
    role = payload.role.strip().lower()

    if not is_valid_phone(phone):
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Phone must be a valid 10-digit Indian mobile number",
        )

    if role not in ALLOWED_ROLES:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Role must be citizen, staff, or leader",
        )

    if not verify_otp_challenge(phone, payload.otp):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired OTP",
        )

    user = await session.scalar(select(User).where(User.phone == phone))
    if user is None or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Phone number is not registered",
        )

    if user.role != role:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"This phone is registered as {user.role}",
        )

    access_token = create_access_token(user_id=user.id, role=user.role)
    return TokenResponse(
        access_token=access_token,
        user=build_user_response(user),
    )


@router.get("/me", response_model=UserResponse)
async def me(current_user: User = Depends(get_current_user)) -> UserResponse:
    return build_user_response(current_user)
