from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status

from app.api.deps import require_roles
from app.core.config import settings
from app.models import User
from app.schemas.voice import VoiceTranscribeResponse
from app.services.dialogflow_speech import (
    SUPPORTED_VOICE_LANGUAGE_CODES,
    dialogflow_configured,
    transcribe_complaint_audio,
)

router = APIRouter(prefix="/voice", tags=["voice"])

MAX_AUDIO_BYTES = 8 * 1024 * 1024


@router.post("/transcribe", response_model=VoiceTranscribeResponse)
async def transcribe_voice(
    file: UploadFile = File(...),
    language_code: str = Form(default="auto"),
    current_user: User = Depends(require_roles("leader", "staff", "citizen")),
) -> VoiceTranscribeResponse:
    if not dialogflow_configured():
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Voice transcription is not configured on the server",
        )

    audio_bytes = await file.read()
    if not audio_bytes:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Empty audio file")
    if len(audio_bytes) > MAX_AUDIO_BYTES:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail="Audio file is too large (max 8 MB)",
        )

    content_type = file.content_type
    if content_type and not content_type.startswith("audio/"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only audio uploads are supported",
        )

    lang = language_code.strip()
    if lang == "auto" or lang not in SUPPORTED_VOICE_LANGUAGE_CODES:
        lang = None

    try:
        transcript, confidence, detected_language = await transcribe_complaint_audio(
            audio_bytes,
            content_type=content_type,
            language_code=lang,
        )
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=_friendly_transcription_error(exc),
        ) from exc

    return VoiceTranscribeResponse(
        transcript=transcript,
        confidence=confidence,
        detected_language=detected_language,
    )


def _friendly_transcription_error(exc: Exception) -> str:
    text = str(exc)
    lower = text.lower()

    if (
        "service_disabled" in lower
        or "has not been used" in lower
        or "speech.googleapis.com" in lower
    ):
        return (
            "Speech-to-Text API is not enabled for this Google Cloud project. "
            "Enable Cloud Speech-to-Text in Google Cloud Console, then try again."
        )

    if "permission_denied" in lower or "403" in text:
        return (
            "The Google Cloud service account does not have permission to transcribe audio. "
            "Check IAM roles and enabled APIs."
        )

    if len(text) > 180 or "{" in text:
        return "Voice transcription failed. Please try again or type your problem."

    return f"Voice transcription failed: {text}"
