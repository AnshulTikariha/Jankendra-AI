import asyncio
from functools import lru_cache
from pathlib import Path

from google.oauth2 import service_account
import vertexai
from vertexai.generative_models import GenerativeModel, Part

from app.core.config import settings

SUPPORTED_VOICE_LANGUAGE_CODES = frozenset({"en-IN", "hi-IN"})


def dialogflow_configured() -> bool:
    """True when Vertex/GCP credentials are available for voice transcription."""
    return bool(settings.gcp_project_id and settings.gcp_service_account_json_path)


def _credentials_path() -> Path:
    if not settings.gcp_service_account_json_path:
        raise RuntimeError("GCP service account path is not configured")
    path = Path(settings.gcp_service_account_json_path)
    if not path.is_absolute():
        path = Path.cwd() / path
    if not path.exists():
        raise RuntimeError(f"GCP service account file not found: {path}")
    return path


@lru_cache
def _credentials():
    return service_account.Credentials.from_service_account_file(
        str(_credentials_path()),
        scopes=["https://www.googleapis.com/auth/cloud-platform"],
    )


@lru_cache
def _gemini_model() -> GenerativeModel:
    if not settings.gcp_project_id:
        raise RuntimeError("GCP project id is not configured")
    vertexai.init(
        project=settings.gcp_project_id,
        location=settings.google_cloud_location,
        credentials=_credentials(),
    )
    return GenerativeModel(settings.vertex_gemini_model)


def _resolve_language_hint(language_code: str | None) -> str:
    if language_code and language_code in SUPPORTED_VOICE_LANGUAGE_CODES:
        return language_code
    return "auto (English or Hindi, India)"


def _transcribe_with_gemini(
    audio_bytes: bytes,
    *,
    content_type: str | None,
    language_code: str | None,
) -> tuple[str, float | None, str | None]:
    mime = content_type or "audio/webm;codecs=opus"
    language_hint = _resolve_language_hint(language_code)
    prompt = (
        "Transcribe this complaint audio exactly as spoken.\n"
        f"Preferred language: {language_hint}.\n"
        "Return only the transcript text without quotes, markdown, or explanations."
    )
    response = _gemini_model().generate_content(
        [prompt, Part.from_data(data=audio_bytes, mime_type=mime)]
    )
    transcript = (response.text or "").strip()
    if not transcript:
        raise RuntimeError("Gemini did not return transcript text")
    return transcript, None, language_code


def _transcribe_sync(
    audio_bytes: bytes,
    *,
    content_type: str | None,
    language_code: str | None,
) -> tuple[str, float | None, str | None]:
    return _transcribe_with_gemini(
        audio_bytes,
        content_type=content_type,
        language_code=language_code,
    )


async def transcribe_complaint_audio(
    audio_bytes: bytes,
    *,
    content_type: str | None = None,
    language_code: str | None = None,
) -> tuple[str, float | None, str | None]:
    return await asyncio.to_thread(
        _transcribe_sync,
        audio_bytes,
        content_type=content_type,
        language_code=language_code,
    )
