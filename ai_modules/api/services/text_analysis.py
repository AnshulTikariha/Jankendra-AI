import os
from functools import lru_cache
from pathlib import Path

from ai_modules.analysis import TextAnalyzer
from ai_modules.api.config import settings
from ai_modules.core.factory import create_vertex_llm_provider

_AI_MODULES_ROOT = Path(__file__).resolve().parents[2]


def _resolve_path(path: str) -> str:
    candidate = Path(path)
    if candidate.is_absolute():
        return str(candidate)
    return str((_AI_MODULES_ROOT / candidate).resolve())


def _apply_google_env() -> None:
    if settings.google_application_credentials:
        os.environ.setdefault(
            "GOOGLE_APPLICATION_CREDENTIALS",
            _resolve_path(settings.google_application_credentials),
        )
    if settings.google_cloud_project:
        os.environ.setdefault("GOOGLE_CLOUD_PROJECT", settings.google_cloud_project)
    os.environ.setdefault("GOOGLE_CLOUD_LOCATION", settings.google_cloud_location)
    os.environ.setdefault("VERTEX_GEMINI_MODEL", settings.vertex_gemini_model)


@lru_cache
def get_text_analyzer() -> TextAnalyzer:
    _apply_google_env()
    return TextAnalyzer(llm_provider=create_vertex_llm_provider())
