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
        sentiment="frustrated",
        severity="critical",
        location="Saket Block C",
        summary="No drinking water for three days in Saket Block C.",
        keywords=["water", "drinking", "supply"],
    )


def test_text_analyzer_rejects_empty_text() -> None:
    analyzer = TextAnalyzer(llm_provider=StubVertexProvider())  # type: ignore[arg-type]

    with pytest.raises(ValueError, match="empty"):
        analyzer.analyze("   ")
