"""Vertex AI Gemini provider using a Google service account."""

from __future__ import annotations

import json
import re
from collections.abc import Sequence
from threading import Lock
from typing import Any

import vertexai
import google.auth
from google.oauth2 import service_account
from vertexai.generative_models import GenerationConfig, GenerativeModel, HarmBlockThreshold, HarmCategory

from ai_modules.core.interfaces import LLMMessage, LLMResponse
from ai_modules.core.settings import GoogleAISettings, get_google_ai_settings

_VERTEX_INIT_LOCK = Lock()
_VERTEX_INITIALIZED = False


def _ensure_vertex_initialized(settings: GoogleAISettings) -> None:
    global _VERTEX_INITIALIZED
    with _VERTEX_INIT_LOCK:
        if _VERTEX_INITIALIZED:
            return
        if settings.credentials_path.is_file():
            credentials = service_account.Credentials.from_service_account_file(
                str(settings.credentials_path),
                scopes=["https://www.googleapis.com/auth/cloud-platform"],
            )
        else:
            credentials, _ = google.auth.default(
                scopes=["https://www.googleapis.com/auth/cloud-platform"],
            )
        vertexai.init(
            project=settings.project_id,
            location=settings.location,
            credentials=credentials,
        )
        _VERTEX_INITIALIZED = True


def _build_prompt(messages: Sequence[LLMMessage]) -> str:
    parts: list[str] = []
    for message in messages:
        role = message.role.strip().lower()
        if role == "system":
            parts.append(f"System:\n{message.content}")
        elif role == "assistant":
            parts.append(f"Assistant:\n{message.content}")
        else:
            parts.append(f"User:\n{message.content}")
    return "\n\n".join(parts)


def _parse_json_text(text: str) -> dict[str, Any]:
    cleaned = text.strip()
    if not cleaned:
        raise ValueError("model returned an empty response")

    if cleaned.startswith("```"):
        cleaned = re.sub(r"^```(?:json)?\s*", "", cleaned, flags=re.IGNORECASE)
        cleaned = re.sub(r"\s*```$", "", cleaned)

    try:
        payload = json.loads(cleaned)
    except json.JSONDecodeError:
        start = cleaned.find("{")
        end = cleaned.rfind("}")
        if start < 0 or end <= start:
            raise
        payload = json.loads(cleaned[start : end + 1])

    if not isinstance(payload, dict):
        raise ValueError("model response must be a JSON object")
    return payload


class VertexGeminiProvider:
    """Gemini text generation through Vertex AI and a service account."""

    def __init__(
        self,
        *,
        settings: GoogleAISettings | None = None,
        default_model: str | None = None,
    ) -> None:
        self.settings = settings or get_google_ai_settings()
        self.default_model = default_model or self.settings.model
        _ensure_vertex_initialized(self.settings)

    def generate(
        self,
        messages: Sequence[LLMMessage],
        *,
        model: str | None = None,
        temperature: float = 0.0,
        max_tokens: int | None = None,
        response_json: bool = False,
        response_schema: dict[str, Any] | None = None,
    ) -> LLMResponse:
        generation_config: dict[str, Any] = {"temperature": temperature}
        if max_tokens is not None:
            generation_config["max_output_tokens"] = max_tokens
        if response_json:
            generation_config["response_mime_type"] = "application/json"
        if response_schema is not None:
            generation_config["response_schema"] = response_schema

        generative_model = GenerativeModel(
            model or self.default_model,
            safety_settings={
                HarmCategory.HARM_CATEGORY_HATE_SPEECH: HarmBlockThreshold.BLOCK_ONLY_HIGH,
                HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT: HarmBlockThreshold.BLOCK_ONLY_HIGH,
                HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT: HarmBlockThreshold.BLOCK_ONLY_HIGH,
                HarmCategory.HARM_CATEGORY_HARASSMENT: HarmBlockThreshold.BLOCK_ONLY_HIGH,
            },
        )
        response = generative_model.generate_content(
            _build_prompt(messages),
            generation_config=GenerationConfig(**generation_config),
        )
        text = response.text or ""
        return LLMResponse(
            text=text,
            raw={
                "model": model or self.default_model,
                "temperature": temperature,
                "max_tokens": max_tokens,
                "response_json": response_json,
            },
        )

    def generate_json(
        self,
        messages: Sequence[LLMMessage],
        *,
        model: str | None = None,
        temperature: float = 0.0,
        max_tokens: int | None = None,
        response_schema: dict[str, Any] | None = None,
    ) -> dict[str, Any]:
        last_error: Exception | None = None
        for attempt in range(2):
            response = self.generate(
                messages,
                model=model,
                temperature=temperature,
                max_tokens=max_tokens,
                response_json=True,
                response_schema=response_schema,
            )
            try:
                return _parse_json_text(response.text)
            except (json.JSONDecodeError, ValueError) as exc:
                last_error = exc
        raise ValueError(f"could not parse model JSON response: {last_error}") from last_error
