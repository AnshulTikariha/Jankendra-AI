"""Paragraph-level complaint text analysis."""

from __future__ import annotations

from dataclasses import dataclass
from typing import Literal

from ai_modules.core.interfaces import LLMMessage
from ai_modules.core.providers.vertex_gemini import VertexGeminiProvider

SentimentLabel = Literal["positive", "neutral", "negative", "frustrated", "urgent"]
SeverityLabel = Literal["low", "medium", "high", "critical"]
CategoryLabel = Literal[
    "water", "roads", "drainage", "electricity", "health", "sanitation", "other"
]

ALLOWED_SENTIMENTS: set[str] = {"positive", "neutral", "negative", "frustrated", "urgent"}
ALLOWED_SEVERITIES: set[str] = {"low", "medium", "high", "critical"}
ALLOWED_CATEGORIES: set[str] = {
    "water",
    "roads",
    "drainage",
    "electricity",
    "health",
    "sanitation",
    "other",
}

ANALYSIS_RESPONSE_SCHEMA: dict[str, object] = {
    "type": "object",
    "properties": {
        "categories": {
            "type": "array",
            "items": {
                "type": "string",
                "enum": [
                    "water",
                    "roads",
                    "drainage",
                    "electricity",
                    "health",
                    "sanitation",
                    "other",
                ],
            },
        },
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
    "required": ["categories", "sentiment", "severity", "location", "summary", "keywords"],
}

SYSTEM_PROMPT = """You analyze citizen complaint paragraphs from Indian constituencies.
Return only valid JSON with these exact keys:
- categories: array of one or more values from water, roads, drainage, electricity, health, sanitation, other
- sentiment: one of positive, neutral, negative, frustrated, urgent
- severity: one of low, medium, high, critical
- location: extracted place name, landmark, ward, colony, or street; null if not mentioned
- summary: one short sentence describing the core problem
- keywords: array of up to 5 short issue keywords

Category definitions (include every type that clearly applies):
- water: drinking water, supply, pressure, contamination, pipeline leaks
- roads: potholes, footpaths, road surface damage, traffic signals
- drainage: blocked drains, standing water, sewage overflow, manholes
- electricity: power outages, street lights, unsafe wiring, transformers
- health: mosquito breeding, clinic access, waste hazards, stray animals
- sanitation: garbage collection, open dumping, public toilets, dead animals
- other: issues that do not clearly fit the categories above

Rules:
- categories must list every distinct problem type mentioned, not just the main one
- use a single-item array when only one category applies
- put the most important category first
- frustrated or urgent sentiment is for angry or time-sensitive complaints
- severity reflects public-health/safety risk and scale of disruption, not writing style
- location must come from the text; do not invent places
- if no location is mentioned, location must be null
"""


@dataclass(frozen=True, slots=True)
class TextAnalysisResult:
    categories: list[CategoryLabel]
    sentiment: SentimentLabel
    severity: SeverityLabel
    location: str | None
    summary: str
    keywords: list[str]


class TextAnalyzer:
    """Classifies category, sentiment, severity, and location from complaint text."""

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


def _parse_categories(raw: object) -> list[CategoryLabel]:
    values: list[str] = []
    if isinstance(raw, str):
        values = [raw]
    elif isinstance(raw, list):
        values = [str(item) for item in raw]
    else:
        raise ValueError("categories must be a non-empty array")

    categories: list[CategoryLabel] = []
    for value in values:
        label = value.strip().lower()
        if not label or label in categories:
            continue
        if label not in ALLOWED_CATEGORIES:
            raise ValueError(f"unsupported category label: {label}")
        categories.append(label)  # type: ignore[arg-type]

    if not categories:
        raise ValueError("categories must include at least one valid label")
    return categories


def _parse_payload(payload: dict[str, object]) -> TextAnalysisResult:
    categories = _parse_categories(payload.get("categories", payload.get("category")))
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
        categories=categories,
        sentiment=sentiment,  # type: ignore[arg-type]
        severity=severity,  # type: ignore[arg-type]
        location=location,
        summary=summary,
        keywords=keywords,
    )
