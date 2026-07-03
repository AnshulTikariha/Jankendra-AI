"""Ollama LLM provider adapter stub."""

from __future__ import annotations

from collections.abc import Sequence

from ai_modules.core.interfaces import LLMMessage, LLMResponse


class OllamaLLMProvider:
    """Ollama provider placeholder for the production/local model environment."""

    def __init__(self, *, base_url: str = "http://localhost:11434") -> None:
        self.base_url = base_url

    def generate(
        self,
        messages: Sequence[LLMMessage],
        *,
        model: str | None = None,
        temperature: float = 0.0,
        max_tokens: int | None = None,
    ) -> LLMResponse:
        raise NotImplementedError("Ollama provider implementation is pending")
