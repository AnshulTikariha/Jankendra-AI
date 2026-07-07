"""Backend bridge to the AI Modules leader-intelligence endpoints.

Mirrors the httpx pattern in complaint_text_analysis.py: the backend aggregates
governance data from the database and forwards it to the AI Modules service,
which returns leader-ready narrative content.
"""

from typing import Any

import httpx

from app.core.config import settings


class LeaderAIError(Exception):
    def __init__(self, message: str, status_code: int | None = None) -> None:
        super().__init__(message)
        self.status_code = status_code


def leader_ai_configured() -> bool:
    return bool(settings.ai_modules_api_url.strip())


def _url(path: str) -> str:
    return f"{settings.ai_modules_api_url.rstrip('/')}/api/v1/leader/{path.lstrip('/')}"


async def _post(path: str, payload: dict[str, Any]) -> dict[str, Any]:
    if not leader_ai_configured():
        raise LeaderAIError("Leader AI is not configured on the server", status_code=503)

    try:
        async with httpx.AsyncClient(timeout=90.0) as client:
            response = await client.post(_url(path), json=payload)
    except httpx.RequestError as exc:
        raise LeaderAIError(
            f"AI Modules API is unreachable at {settings.ai_modules_api_url}: {exc}",
            status_code=502,
        ) from exc

    if response.status_code == 503:
        detail = response.json().get("detail", "AI Modules API is not configured")
        raise LeaderAIError(str(detail), status_code=503)

    if response.status_code >= 400:
        try:
            detail = response.json().get("detail", response.text)
        except Exception:  # noqa: BLE001
            detail = response.text
        raise LeaderAIError(str(detail), status_code=response.status_code)

    return response.json()


async def generate_weekly_briefing(payload: dict[str, Any]) -> dict[str, Any]:
    return await _post("briefing", payload)


async def generate_priority_insights(payload: dict[str, Any]) -> dict[str, Any]:
    return await _post("priority-insights", payload)


async def generate_complaint_themes(payload: dict[str, Any]) -> dict[str, Any]:
    return await _post("complaint-themes", payload)
