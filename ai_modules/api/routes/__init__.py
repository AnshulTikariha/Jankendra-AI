from fastapi import APIRouter

from ai_modules.api.routes.analysis import router as analysis_router
from ai_modules.api.routes.health import router as health_router
from ai_modules.api.routes.leader_ai import router as leader_ai_router

api_router = APIRouter()
api_router.include_router(health_router)
api_router.include_router(analysis_router)
api_router.include_router(leader_ai_router)
