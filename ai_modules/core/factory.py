"""Factory helpers for configured AI providers."""

from __future__ import annotations

from ai_modules.core.providers.vertex_gemini import VertexGeminiProvider


def create_vertex_llm_provider() -> VertexGeminiProvider:
    """Return a Vertex AI Gemini provider configured from environment settings."""
    return VertexGeminiProvider()
