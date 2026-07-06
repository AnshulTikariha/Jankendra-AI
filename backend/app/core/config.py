from functools import lru_cache
from typing import Annotated

from pydantic import BeforeValidator, Field
from pydantic_settings import BaseSettings, NoDecode, SettingsConfigDict


def parse_cors_origins(value: str | list[str]) -> list[str]:
    if isinstance(value, str):
        return [origin.strip() for origin in value.split(",") if origin.strip()]
    return value


CorsOrigins = Annotated[list[str], BeforeValidator(parse_cors_origins)]


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    app_name: str = "Jankendra-AI Backend"
    app_version: str = "0.1.0"
    environment: str = "development"
    api_v1_prefix: str = "/api/v1"

    database_url: str = "sqlite+aiosqlite:///./data/jankendra.db"
    db_echo: bool = False
    db_pool_size: int = 5
    db_max_overflow: int = 10

    jwt_secret_key: str = "change-me-in-production-use-a-long-secret"
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 60 * 24

    cors_origins: Annotated[CorsOrigins, NoDecode] = Field(
        default=[
            "http://localhost:5173",
            "http://127.0.0.1:5173",
        ],
    )

    gcp_project_id: str | None = None
    gcp_service_account_json_path: str | None = None
    dialogflow_language_code: str = "en-IN"
    google_cloud_location: str = "asia-south1"
    vertex_gemini_model: str = "gemini-2.5-flash"
    ai_modules_api_url: str = "http://127.0.0.1:8002"


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
