"""Paragraph-level complaint text analysis."""

from __future__ import annotations

from dataclasses import dataclass
from typing import Literal

from ai_modules.core.interfaces import LLMMessage
from ai_modules.core.providers.vertex_gemini import VertexGeminiProvider

SentimentLabel = Literal["positive", "neutral", "negative", "frustrated", "urgent"]
SeverityLabel = Literal["low", "medium", "high", "critical"]

ALLOWED_SENTIMENTS: set[str] = {"positive", "neutral", "negative", "frustrated", "urgent"}
ALLOWED_SEVERITIES: set[str] = {"low", "medium", "high", "critical"}

ANALYSIS_RESPONSE_SCHEMA: dict[str, object] = {
    "type": "object",
    "properties": {
        "sentiment": {
            "type": "string",
            "enum": ["positive", "neutral", "negative", "frustrated", "urgent"],
        },
        "severity": {
            "type": "string",
            "enum": ["low", "medium", "high", "critical"],
        },
        "location": {"type": "string", "nullable": True},
        "summary": {"type": "string"},
        "keywords": {
            "type": "array",
            "items": {"type": "string"},
        },
    },
    "required": ["sentiment", "severity", "location", "summary", "keywords"],
}

SYSTEM_PROMPT = """You analyze citizen complaint paragraphs from Indian constituencies.
Return only valid JSON with these exact keys:
- sentiment: one of positive, neutral, negative, frustrated, urgent
- severity: one of low, medium, high, critical
- location: extracted place name, landmark, ward, colony, or street; null if not mentioned
- summary: one short sentence describing the core problem
- keywords: array of up to 5 short issue keywords

Rules:
- frustrated or urgent sentiment is for angry or time-sensitive complaints
- severity reflects public-health/safety risk and scale of disruption, not writing style
- location must come from the text; do not invent places
- if no location is mentioned, location must be null
"""


@dataclass(frozen=True, slots=True)
class TextAnalysisResult:
    sentiment: SentimentLabel
    severity: SeverityLabel
    location: str | None
    summary: str
    keywords: list[str]


class TextAnalyzer:
    """Classifies sentiment, severity, and location from free-form complaint text."""

    def __init__(self, *, llm_provider: VertexGeminiProvider) -> None:
        self.llm_provider = llm_provider

    def analyze(self, text: str) -> TextAnalysisResult:
        cleaned = text.strip()
        if not cleaned:
            raise ValueError("text must not be empty")

        payload = self.llm_provider.generate_json(
            [
                LLMMessage(role="system", content=SYSTEM_PROMPT),
                LLMMessage(
                    role="user",
                    content=f"Analyze this complaint paragraph:\n\n{cleaned}",
                ),
            ],
            temperature=0.0,
            max_tokens=8096,
            response_schema=ANALYSIS_RESPONSE_SCHEMA,
        )
        return _parse_payload(payload)


def _parse_payload(payload: dict[str, object]) -> TextAnalysisResult:
    sentiment = str(payload.get("sentiment", "")).strip().lower()
    severity = str(payload.get("severity", "")).strip().lower()
    if sentiment not in ALLOWED_SENTIMENTS:
        raise ValueError(f"unsupported sentiment label: {sentiment}")
    if severity not in ALLOWED_SEVERITIES:
        raise ValueError(f"unsupported severity label: {severity}")

    location_raw = payload.get("location")
    location = None
    if isinstance(location_raw, str):
        location = location_raw.strip() or None

    summary = str(payload.get("summary", "")).strip()
    if not summary:
        raise ValueError("summary is missing from model response")

    keywords_raw = payload.get("keywords", [])
    keywords: list[str] = []
    if isinstance(keywords_raw, list):
        keywords = [str(item).strip() for item in keywords_raw if str(item).strip()][:5]

    return TextAnalysisResult(
        sentiment=sentiment,  # type: ignore[arg-type]
        severity=severity,  # type: ignore[arg-type]
        location=location,
        summary=summary,
        keywords=keywords,
    )
