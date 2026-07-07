"""Leader-facing generative intelligence built on the Vertex Gemini provider.

Three capabilities, all stateless: the backend aggregates governance data from
the database and passes it in; this engine turns it into leader-ready prose.

- weekly_briefing: narrative executive summary from digest aggregates
- priority_explanations: plain-language "why + recommended action" per priority
- complaint_themes: emerging themes/trends across recent complaints
"""

from __future__ import annotations

import json
from typing import Any

from ai_modules.core.interfaces import LLMMessage
from ai_modules.core.providers.vertex_gemini import VertexGeminiProvider

BRIEFING_SCHEMA: dict[str, Any] = {
    "type": "object",
    "properties": {
        "headline": {"type": "string"},
        "summary": {"type": "string"},
        "highlights": {"type": "array", "items": {"type": "string"}},
        "risks": {"type": "array", "items": {"type": "string"}},
        "recommendations": {"type": "array", "items": {"type": "string"}},
    },
    "required": ["headline", "summary", "highlights", "risks", "recommendations"],
}

PRIORITY_INSIGHTS_SCHEMA: dict[str, Any] = {
    "type": "object",
    "properties": {
        "overview": {"type": "string"},
        "items": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "id": {"type": "string"},
                    "explanation": {"type": "string"},
                    "recommended_action": {"type": "string"},
                },
                "required": ["id", "explanation", "recommended_action"],
            },
        },
    },
    "required": ["overview", "items"],
}

THEMES_SCHEMA: dict[str, Any] = {
    "type": "object",
    "properties": {
        "overview": {"type": "string"},
        "themes": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "theme": {"type": "string"},
                    "category": {"type": "string"},
                    "count": {"type": "integer"},
                    "summary": {"type": "string"},
                    "severity": {
                        "type": "string",
                        "enum": ["low", "medium", "high", "critical"],
                    },
                    "wards": {"type": "array", "items": {"type": "string"}},
                },
                "required": ["theme", "category", "count", "summary", "severity", "wards"],
            },
        },
    },
    "required": ["overview", "themes"],
}

BRIEFING_PROMPT = """You are a chief-of-staff writing a weekly governance briefing for an
elected representative (the "leader") of an Indian constituency. You are given aggregated
numbers for the reporting period. Write a concise, confident, plain-English briefing.

Return only valid JSON with these keys:
- headline: one short punchy line summarising the week (max ~12 words)
- summary: 2-3 sentences giving the overall state of the constituency this period
- highlights: 2-4 bullet strings of what went well or notable positive movement
- risks: 2-4 bullet strings of the most important risks or things slipping
- recommendations: 2-4 bullet strings of specific actions the leader should take next

Rules:
- Base every statement on the numbers provided; never invent data or ward names.
- Refer to real ward names from the data when calling out hotspots.
- Be specific and action-oriented; avoid generic filler.
- Keep each bullet to a single short sentence.
"""

PRIORITY_INSIGHTS_PROMPT = """You advise an elected representative on where to focus
development effort. You are given a ranked list of prioritised actions for a constituency,
each with a score and machine-generated reasons. For each item, write a plain-language
explanation a busy leader can grasp in seconds, plus one concrete recommended next action.

Return only valid JSON with:
- overview: 2-3 sentences on the overall shape of the priority list (what dominates, patterns)
- items: an array with one object per input priority, each having:
  - id: the exact id from the input
  - explanation: 1-2 sentences on why this matters and why it ranks where it does
  - recommended_action: one specific, practical next step (who/what)

Rules:
- Return exactly one item per input priority, using the same id.
- Ground everything in the provided fields; do not invent numbers or wards.
- Be concrete and non-repetitive across items.
"""

THEMES_PROMPT = """You analyse recent citizen complaints for an elected representative and
surface the emerging themes. You are given a list of recent complaint summaries with their
ward and category. Group them into the most important themes.

Return only valid JSON with:
- overview: 2-3 sentences describing the overall complaint landscape this period
- themes: an array (most important first, at most 6) of objects with:
  - theme: a short human title for the theme (e.g. "Water supply disruptions")
  - category: the dominant category for the theme
  - count: how many of the provided complaints fall under this theme (integer)
  - summary: one sentence describing the theme and where it concentrates
  - severity: one of low, medium, high, critical (public-health/safety and scale)
  - wards: list of ward names most affected by this theme

Rules:
- Only use ward names and categories present in the input.
- Counts must be consistent with the number of complaints provided.
- Merge near-duplicate issues into a single theme.
"""


class LeaderAIGenerator:
    """Generates leader-facing narrative intelligence from aggregated data."""

    def __init__(self, *, llm_provider: VertexGeminiProvider) -> None:
        self.llm_provider = llm_provider

    def weekly_briefing(self, context: dict[str, Any]) -> dict[str, Any]:
        payload = self.llm_provider.generate_json(
            [
                LLMMessage(role="system", content=BRIEFING_PROMPT),
                LLMMessage(
                    role="user",
                    content=(
                        "Generate the weekly briefing from this data:\n\n"
                        + json.dumps(context, ensure_ascii=False, default=str)
                    ),
                ),
            ],
            temperature=0.3,
            max_tokens=2048,
            response_schema=BRIEFING_SCHEMA,
        )
        return {
            "headline": _as_str(payload.get("headline")),
            "summary": _as_str(payload.get("summary")),
            "highlights": _as_str_list(payload.get("highlights")),
            "risks": _as_str_list(payload.get("risks")),
            "recommendations": _as_str_list(payload.get("recommendations")),
        }

    def priority_explanations(self, context: dict[str, Any]) -> dict[str, Any]:
        payload = self.llm_provider.generate_json(
            [
                LLMMessage(role="system", content=PRIORITY_INSIGHTS_PROMPT),
                LLMMessage(
                    role="user",
                    content=(
                        "Explain and recommend actions for these priorities:\n\n"
                        + json.dumps(context, ensure_ascii=False, default=str)
                    ),
                ),
            ],
            temperature=0.2,
            max_tokens=4096,
            response_schema=PRIORITY_INSIGHTS_SCHEMA,
        )
        items = []
        raw_items = payload.get("items")
        if isinstance(raw_items, list):
            for item in raw_items:
                if not isinstance(item, dict):
                    continue
                item_id = _as_str(item.get("id"))
                if not item_id:
                    continue
                items.append(
                    {
                        "id": item_id,
                        "explanation": _as_str(item.get("explanation")),
                        "recommended_action": _as_str(item.get("recommended_action")),
                    }
                )
        return {"overview": _as_str(payload.get("overview")), "items": items}

    def complaint_themes(self, context: dict[str, Any]) -> dict[str, Any]:
        payload = self.llm_provider.generate_json(
            [
                LLMMessage(role="system", content=THEMES_PROMPT),
                LLMMessage(
                    role="user",
                    content=(
                        "Identify the themes across these recent complaints:\n\n"
                        + json.dumps(context, ensure_ascii=False, default=str)
                    ),
                ),
            ],
            temperature=0.2,
            max_tokens=4096,
            response_schema=THEMES_SCHEMA,
        )
        themes = []
        raw_themes = payload.get("themes")
        if isinstance(raw_themes, list):
            for theme in raw_themes:
                if not isinstance(theme, dict):
                    continue
                severity = _as_str(theme.get("severity")).lower()
                if severity not in {"low", "medium", "high", "critical"}:
                    severity = "medium"
                themes.append(
                    {
                        "theme": _as_str(theme.get("theme")),
                        "category": _as_str(theme.get("category")) or "other",
                        "count": _as_int(theme.get("count")),
                        "summary": _as_str(theme.get("summary")),
                        "severity": severity,
                        "wards": _as_str_list(theme.get("wards")),
                    }
                )
        return {"overview": _as_str(payload.get("overview")), "themes": themes}


def _as_str(value: object) -> str:
    if value is None:
        return ""
    return str(value).strip()


def _as_str_list(value: object) -> list[str]:
    if not isinstance(value, list):
        return []
    return [str(item).strip() for item in value if str(item).strip()]


def _as_int(value: object) -> int:
    try:
        return int(value)  # type: ignore[arg-type]
    except (TypeError, ValueError):
        return 0
