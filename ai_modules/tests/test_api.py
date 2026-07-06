from fastapi import FastAPI
from fastapi.testclient import TestClient

from ai_modules.analysis.text_analyzer import TextAnalysisResult
from ai_modules.api.routes.analysis import router as analysis_router
from ai_modules.api.services.text_analysis import get_text_analyzer


class FakeTextAnalyzer:
    def analyze(self, text: str) -> TextAnalysisResult:
        return TextAnalysisResult(
            categories=["drainage", "health"],
            sentiment="negative",
            severity="high",
            location="Malviya Nagar",
            summary="Open drain causing foul smell and mosquito risk.",
            keywords=["drain", "mosquito", "sanitation"],
        )


def _build_client() -> TestClient:
    app = FastAPI()
    app.include_router(analysis_router, prefix="/api/v1")
    app.dependency_overrides[get_text_analyzer] = lambda: FakeTextAnalyzer()
    return TestClient(app)


def test_analyze_text_without_auth() -> None:
    client = _build_client()

    response = client.post(
        "/api/v1/analyze-text",
        json={
            "text": "Open drain near Malviya Nagar market is causing foul smell and mosquitoes."
        },
    )

    assert response.status_code == 200
    body = response.json()
    assert body["categories"] == ["drainage", "health"]
    assert body["sentiment"] == "negative"
    assert body["severity"] == "high"
    assert body["location"] == "Malviya Nagar"
    assert body["keywords"] == ["drain", "mosquito", "sanitation"]


def test_analyze_text_rejects_empty_input() -> None:
    client = _build_client()

    response = client.post("/api/v1/analyze-text", json={"text": ""})

    assert response.status_code == 422
