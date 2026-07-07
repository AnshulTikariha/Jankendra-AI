from functools import lru_cache

from ai_modules.api.services.text_analysis import _apply_google_env
from ai_modules.core.factory import create_vertex_llm_provider
from ai_modules.leader_ai import LeaderAIGenerator


@lru_cache
def get_leader_ai_generator() -> LeaderAIGenerator:
    _apply_google_env()
    return LeaderAIGenerator(llm_provider=create_vertex_llm_provider())
