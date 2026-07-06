from pydantic import BaseModel, Field


class VoiceTranscribeResponse(BaseModel):
    transcript: str
    confidence: float | None = Field(default=None, ge=0, le=1)
    detected_language: str | None = None
