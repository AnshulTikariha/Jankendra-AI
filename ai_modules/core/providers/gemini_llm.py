"""Gemini LLM provider adapter stub."""

from __future__ import annotations

from collections.abc import Sequence

from ai_modules.core.interfaces import LLMMessage, LLMResponse


class GeminiLLMProvider:
    """Google Gemini provider placeholder for the development environment."""

    def __init__(self, *, api_key: str | None = None) -> None:
        self.api_key = api_key

    def generate(
        self,
        messages: Sequence[LLMMessage],
        *,
        model: str | None = None,
        temperature: float = 0.0,
        max_tokens: int | None = None,
    ) -> LLMResponse:
        raise NotImplementedError("Gemini provider implementation is pending")
