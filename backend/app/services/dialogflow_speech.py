import asyncio
import uuid
from functools import lru_cache
from pathlib import Path

from google.cloud import dialogflow_v2 as dialogflow
from google.cloud import speech
from google.oauth2 import service_account

from app.core.config import settings

SUPPORTED_VOICE_LANGUAGE_CODES = frozenset({"en-IN", "hi-IN"})

DIALOGFLOW_ENCODING_BY_MIME: dict[str, dialogflow.AudioEncoding] = {
    "audio/ogg": dialogflow.AudioEncoding.AUDIO_ENCODING_OGG_OPUS,
    "audio/ogg;codecs=opus": dialogflow.AudioEncoding.AUDIO_ENCODING_OGG_OPUS,
    "audio/wav": dialogflow.AudioEncoding.AUDIO_ENCODING_LINEAR_16,
    "audio/x-wav": dialogflow.AudioEncoding.AUDIO_ENCODING_LINEAR_16,
    "audio/flac": dialogflow.AudioEncoding.AUDIO_ENCODING_FLAC,
}

SPEECH_ENCODING_BY_MIME: dict[str, speech.RecognitionConfig.AudioEncoding] = {
    "audio/webm": speech.RecognitionConfig.AudioEncoding.WEBM_OPUS,
    "audio/webm;codecs=opus": speech.RecognitionConfig.AudioEncoding.WEBM_OPUS,
    "audio/ogg": speech.RecognitionConfig.AudioEncoding.OGG_OPUS,
    "audio/ogg;codecs=opus": speech.RecognitionConfig.AudioEncoding.OGG_OPUS,
    "audio/wav": speech.RecognitionConfig.AudioEncoding.LINEAR16,
    "audio/x-wav": speech.RecognitionConfig.AudioEncoding.LINEAR16,
    "audio/flac": speech.RecognitionConfig.AudioEncoding.FLAC,
}


def dialogflow_configured() -> bool:
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
def _sessions_client() -> dialogflow.SessionsClient:
    return dialogflow.SessionsClient(credentials=_credentials())


@lru_cache
def _speech_client() -> speech.SpeechClient:
    return speech.SpeechClient(credentials=_credentials())


def _normalize_content_type(content_type: str | None) -> str:
    if not content_type:
        return "audio/webm;codecs=opus"
    return content_type.split(";")[0].strip().lower()


def _sample_rate_for_mime(normalized_mime: str) -> int:
    if normalized_mime in ("audio/webm", "audio/ogg"):
        return 48_000
    return 16_000


def resolve_voice_languages(language_code: str | None) -> tuple[str, list[str]]:
    """Pick primary + alternative BCP-47 tags for Speech-to-Text."""
    if language_code and language_code in SUPPORTED_VOICE_LANGUAGE_CODES:
        # When the client sends an explicit language, stick to it (no bilingual fallback).
        return language_code, []
    # Auto-detect between Hindi and English (India).
    return "en-IN", ["hi-IN"]


def _transcribe_with_speech(
    audio_bytes: bytes,
    *,
    content_type: str | None,
    language_code: str | None,
) -> tuple[str, float | None, str | None]:
    normalized = _normalize_content_type(content_type)
    full_type = (content_type or "audio/webm;codecs=opus").lower()
    encoding = SPEECH_ENCODING_BY_MIME.get(full_type) or SPEECH_ENCODING_BY_MIME.get(
        normalized,
        speech.RecognitionConfig.AudioEncoding.WEBM_OPUS,
    )
    sample_rate = _sample_rate_for_mime(normalized)
    primary_lang, alternative_langs = resolve_voice_languages(language_code)

    config = speech.RecognitionConfig(
        encoding=encoding,
        sample_rate_hertz=sample_rate,
        language_code=primary_lang,
        alternative_language_codes=alternative_langs,
        enable_automatic_punctuation=True,
    )
    audio = speech.RecognitionAudio(content=audio_bytes)
    response = _speech_client().recognize(config=config, audio=audio)

    parts: list[str] = []
    confidence_values: list[float] = []
    detected_languages: list[str] = []
    for result in response.results:
        if not result.alternatives:
            continue
        best = result.alternatives[0]
        if best.transcript:
            parts.append(best.transcript.strip())
        if best.confidence:
            confidence_values.append(float(best.confidence))
        if result.language_code:
            detected_languages.append(result.language_code)

    transcript = " ".join(parts).strip()
    if not transcript:
        raise RuntimeError("Speech-to-Text did not return any transcript")

    confidence = sum(confidence_values) / len(confidence_values) if confidence_values else None
    detected = detected_languages[0] if detected_languages else primary_lang
    return transcript, confidence, detected


def _transcribe_with_dialogflow(
    audio_bytes: bytes,
    *,
    content_type: str | None,
    language_code: str | None,
) -> tuple[str, float | None, str | None]:
    if not settings.gcp_project_id:
        raise RuntimeError("GCP project id is not configured")

    full_type = (content_type or "audio/ogg;codecs=opus").lower()
    normalized = _normalize_content_type(content_type)
    encoding = DIALOGFLOW_ENCODING_BY_MIME.get(full_type) or DIALOGFLOW_ENCODING_BY_MIME.get(
        normalized,
        dialogflow.AudioEncoding.AUDIO_ENCODING_OGG_OPUS,
    )
    sample_rate = _sample_rate_for_mime(normalized)
    primary_lang, _ = resolve_voice_languages(language_code)
    session_client = _sessions_client()
    session_id = uuid.uuid4().hex
    session = session_client.session_path(settings.gcp_project_id, session_id)

    audio_config = dialogflow.InputAudioConfig(
        audio_encoding=encoding,
        language_code=primary_lang,
        sample_rate_hertz=sample_rate,
    )
    query_input = dialogflow.QueryInput(audio_config=audio_config)
    request = dialogflow.DetectIntentRequest(
        session=session,
        input_audio=audio_bytes,
        query_input=query_input,
    )
    response = session_client.detect_intent(request=request)
    query_result = response.query_result
    transcript = (query_result.query or query_result.fulfillment_text or "").strip()

    if not transcript:
        raise RuntimeError("Dialogflow did not return any transcript text")

    confidence = None
    if query_result.speech_recognition_confidence:
        confidence = float(query_result.speech_recognition_confidence)

    return transcript, confidence, primary_lang


def _transcribe_sync(
    audio_bytes: bytes,
    *,
    content_type: str | None,
    language_code: str | None,
) -> tuple[str, float | None, str | None]:
    normalized = _normalize_content_type(content_type)
    if normalized == "audio/webm":
        return _transcribe_with_speech(
            audio_bytes,
            content_type=content_type,
            language_code=language_code,
        )
    if normalized in DIALOGFLOW_ENCODING_BY_MIME or normalized == "audio/ogg":
        try:
            return _transcribe_with_dialogflow(
                audio_bytes,
                content_type=content_type,
                language_code=language_code,
            )
        except Exception:
            return _transcribe_with_speech(
                audio_bytes,
                content_type=content_type,
                language_code=language_code,
            )
    return _transcribe_with_speech(
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
