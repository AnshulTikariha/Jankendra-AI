from fastapi import APIRouter, Depends, HTTPException, status
from google.api_core import exceptions as google_exceptions

from ai_modules.analysis import TextAnalyzer
from ai_modules.api.config import settings
from ai_modules.api.schemas.analysis import TextAnalysisRequest, TextAnalysisResponse
from ai_modules.api.services.text_analysis import get_text_analyzer

router = APIRouter(tags=["analysis"])


@router.post("/analyze-text", response_model=TextAnalysisResponse)
async def analyze_text(
    payload: TextAnalysisRequest,
    analyzer: TextAnalyzer = Depends(get_text_analyzer),
) -> TextAnalysisResponse:
    try:
        result = analyzer.analyze(payload.text)
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        ) from exc
    except FileNotFoundError as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Google credentials are not configured on the server.",
        ) from exc
    except google_exceptions.GoogleAPIError as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=(
                f"Vertex AI request failed: {exc.message}. "
                "Check that the model is available in your region "
                f"({settings.google_cloud_location}) and that Vertex AI API is enabled."
            ),
        ) from exc
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Text analysis failed. Check Vertex AI credentials and model access.",
        ) from exc

    return TextAnalysisResponse(
        categories=result.categories,
        sentiment=result.sentiment,
        severity=result.severity,
        location=result.location,
        summary=result.summary,
        keywords=result.keywords,
    )
