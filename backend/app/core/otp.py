from datetime import datetime, timedelta, timezone

DEV_OTP = "246810"
OTP_EXPIRE_MINUTES = 10
ALLOWED_ROLES = {"citizen", "staff", "leader"}

_otp_store: dict[str, datetime] = {}


def normalize_phone(phone: str) -> str:
    digits = "".join(character for character in phone if character.isdigit())
    if len(digits) == 12 and digits.startswith("91"):
        digits = digits[2:]
    return digits


def is_valid_phone(phone: str) -> bool:
    return len(normalize_phone(phone)) == 10


def create_otp_challenge(phone: str) -> str:
    normalized = normalize_phone(phone)
    _otp_store[normalized] = datetime.now(timezone.utc) + timedelta(minutes=OTP_EXPIRE_MINUTES)
    return DEV_OTP


def verify_otp_challenge(phone: str, otp: str) -> bool:
    normalized = normalize_phone(phone)
    expires_at = _otp_store.get(normalized)
    if expires_at is None:
        return False

    if datetime.now(timezone.utc) > expires_at:
        _otp_store.pop(normalized, None)
        return False

    if otp.strip() != DEV_OTP:
        return False

    _otp_store.pop(normalized, None)
    return True
