import pytest

from ai_modules.analysis import TextAnalyzer
from ai_modules.analysis.text_analyzer import TextAnalysisResult


class StubVertexProvider:
    def generate_json(
        self,
        messages,
        *,
        model=None,
        temperature=0.0,
        max_tokens=None,
        response_schema=None,
    ):
        return {
            "categories": ["water"],
            "sentiment": "frustrated",
            "severity": "critical",
            "location": "Saket Block C",
            "summary": "No drinking water for three days in Saket Block C.",
            "keywords": ["water", "drinking", "supply"],
        }


def test_text_analyzer_parses_vertex_json() -> None:
    analyzer = TextAnalyzer(llm_provider=StubVertexProvider())  # type: ignore[arg-type]

    result = analyzer.analyze(
        "We have had no drinking water for three days near Saket Block C. This is urgent."
    )

    assert result == TextAnalysisResult(
        categories=["water"],
        sentiment="frustrated",
        severity="critical",
        location="Saket Block C",
        summary="No drinking water for three days in Saket Block C.",
        keywords=["water", "drinking", "supply"],
    )


def test_text_analyzer_parses_multiple_categories() -> None:
    class MultiCategoryStub(StubVertexProvider):
        def generate_json(self, messages, **kwargs):
            return {
                "categories": ["electricity", "water"],
                "sentiment": "frustrated",
                "severity": "high",
                "location": "Green Park colony",
                "summary": "No power and no water for four days.",
                "keywords": ["power", "water", "outage"],
            }

    analyzer = TextAnalyzer(llm_provider=MultiCategoryStub())  # type: ignore[arg-type]
    result = analyzer.analyze("No current for four days so water pump is not working.")

    assert result.categories == ["electricity", "water"]


def test_text_analyzer_rejects_empty_text() -> None:
    analyzer = TextAnalyzer(llm_provider=StubVertexProvider())  # type: ignore[arg-type]

    with pytest.raises(ValueError, match="empty"):
        analyzer.analyze("   ")
