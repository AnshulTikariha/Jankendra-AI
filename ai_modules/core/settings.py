"""Environment-driven settings for AI providers."""

from __future__ import annotations

import json
import os
from dataclasses import dataclass
from functools import lru_cache
from pathlib import Path


def _repo_root() -> Path:
    return Path(__file__).resolve().parents[2]


def _default_credentials_path() -> Path:
    return _repo_root() / "ai_modules" / "credentials" / "google-credential.json"


@dataclass(frozen=True, slots=True)
class GoogleAISettings:
    credentials_path: Path
    project_id: str
    location: str
    model: str


@lru_cache
def get_google_ai_settings() -> GoogleAISettings:
    credentials_path = Path(
        os.environ.get("GOOGLE_APPLICATION_CREDENTIALS", str(_default_credentials_path()))
    ).resolve()

    project_id = os.environ.get("GOOGLE_CLOUD_PROJECT")
    if not project_id and credentials_path.is_file():
        with credentials_path.open(encoding="utf-8") as handle:
            project_id = json.load(handle).get("project_id")

    if not project_id:
        raise ValueError(
            "GOOGLE_CLOUD_PROJECT is not set and could not be read from the credentials file."
        )

    return GoogleAISettings(
        credentials_path=credentials_path,
        project_id=project_id,
        location=os.environ.get("GOOGLE_CLOUD_LOCATION", "asia-south1"),
        model=os.environ.get("VERTEX_GEMINI_MODEL", "gemini-2.5-flash"),
    )
