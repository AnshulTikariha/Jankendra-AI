import httpx

from app.core.config import settings


class ComplaintAnalysisError(Exception):
    def __init__(self, message: str, status_code: int | None = None) -> None:
        super().__init__(message)
        self.status_code = status_code


class ComplaintTextAnalysisResult:
    def __init__(
        self,
        *,
        categories: list[str],
        sentiment: str,
        severity: str,
        location: str | None,
        summary: str,
        keywords: list[str],
    ) -> None:
        self.categories = categories
        self.sentiment = sentiment
        self.severity = severity
        self.location = location
        self.summary = summary
        self.keywords = keywords


def complaint_analysis_configured() -> bool:
    return bool(settings.ai_modules_api_url.strip())


def _analysis_url() -> str:
    return f"{settings.ai_modules_api_url.rstrip('/')}/api/v1/analyze-text"


async def analyze_complaint_text(text: str) -> ComplaintTextAnalysisResult:
    if not complaint_analysis_configured():
        raise ComplaintAnalysisError("Complaint text analysis is not configured on the server")

    try:
        async with httpx.AsyncClient(timeout=90.0) as client:
            response = await client.post(_analysis_url(), json={"text": text})
    except httpx.RequestError as exc:
        raise ComplaintAnalysisError(
            f"AI Modules API is unreachable at {settings.ai_modules_api_url}: {exc}",
        ) from exc

    if response.status_code == 400:
        detail = response.json().get("detail", "Invalid analysis request")
        raise ValueError(detail)

    if response.status_code == 503:
        detail = response.json().get("detail", "AI Modules API is not configured")
        raise FileNotFoundError(detail)

    if response.status_code >= 400:
        detail = response.json().get("detail", response.text)
        raise ComplaintAnalysisError(str(detail), status_code=response.status_code)

    payload = response.json()
    return ComplaintTextAnalysisResult(
        categories=list(payload.get("categories", [])),
        sentiment=str(payload.get("sentiment", "")),
        severity=str(payload.get("severity", "")),
        location=payload.get("location"),
        summary=str(payload.get("summary", "")),
        keywords=list(payload.get("keywords", [])),
    )
