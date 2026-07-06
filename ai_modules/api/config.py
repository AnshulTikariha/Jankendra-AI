from functools import lru_cache
from pathlib import Path
from typing import Annotated

from pydantic import BeforeValidator, Field
from pydantic_settings import BaseSettings, NoDecode, SettingsConfigDict

_AI_MODULES_ROOT = Path(__file__).resolve().parents[1]


def parse_cors_origins(value: str | list[str]) -> list[str]:
    if isinstance(value, str):
        return [origin.strip() for origin in value.split(",") if origin.strip()]
    return value


CorsOrigins = Annotated[list[str], BeforeValidator(parse_cors_origins)]


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=str(_AI_MODULES_ROOT / ".env"),
        env_file_encoding="utf-8",
        extra="ignore",
    )

    app_name: str = "Jankendra-AI Modules"
    app_version: str = "0.1.0"
    environment: str = "development"
    api_v1_prefix: str = "/api/v1"
    host: str = "127.0.0.1"
    port: int = 8001

    google_application_credentials: str | None = None
    google_cloud_project: str | None = None
    google_cloud_location: str = "asia-south1"
    vertex_gemini_model: str = "gemini-2.5-flash"

    cors_origins: Annotated[CorsOrigins, NoDecode] = Field(
        default=[
            "http://localhost:5173",
            "http://127.0.0.1:5173",
            "http://localhost:8000",
            "http://127.0.0.1:8000",
        ],
    )


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
