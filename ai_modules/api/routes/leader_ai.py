from fastapi import APIRouter, Depends, HTTPException, status
from google.api_core import exceptions as google_exceptions

from ai_modules.api.config import settings
from ai_modules.api.schemas.leader_ai import (
    BriefingRequest,
    BriefingResponse,
    ComplaintThemesRequest,
    ComplaintThemesResponse,
    PriorityInsightsRequest,
    PriorityInsightsResponse,
)
from ai_modules.api.services.leader_ai import get_leader_ai_generator
from ai_modules.leader_ai import LeaderAIGenerator

router = APIRouter(tags=["leader-ai"], prefix="/leader")


def _handle_generation(func):
    """Run a generator call and map failures to consistent HTTP errors."""
    try:
        return func()
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
                f"Check model availability in {settings.google_cloud_location}."
            ),
        ) from exc
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Leader AI generation failed. Check Vertex AI credentials and model access.",
        ) from exc


@router.post("/briefing", response_model=BriefingResponse)
async def weekly_briefing(
    payload: BriefingRequest,
    generator: LeaderAIGenerator = Depends(get_leader_ai_generator),
) -> BriefingResponse:
    result = _handle_generation(lambda: generator.weekly_briefing(payload.model_dump()))
    return BriefingResponse(**result)


@router.post("/priority-insights", response_model=PriorityInsightsResponse)
async def priority_insights(
    payload: PriorityInsightsRequest,
    generator: LeaderAIGenerator = Depends(get_leader_ai_generator),
) -> PriorityInsightsResponse:
    if not payload.priorities:
        return PriorityInsightsResponse(overview="", items=[])
    result = _handle_generation(
        lambda: generator.priority_explanations(payload.model_dump())
    )
    return PriorityInsightsResponse(**result)


@router.post("/complaint-themes", response_model=ComplaintThemesResponse)
async def complaint_themes(
    payload: ComplaintThemesRequest,
    generator: LeaderAIGenerator = Depends(get_leader_ai_generator),
) -> ComplaintThemesResponse:
    if not payload.complaints:
        return ComplaintThemesResponse(overview="No recent complaints in this period.", themes=[])
    result = _handle_generation(lambda: generator.complaint_themes(payload.model_dump()))
    return ComplaintThemesResponse(**result)
