import { apiFetch } from './httpClient'
import type {
  ApiComplaintThemesResponse,
  ApiPriorityInsightsResponse,
  ApiWeeklyBriefing,
} from './types/leaderAi'

export function fetchWeeklyBriefing(token: string): Promise<ApiWeeklyBriefing> {
  return apiFetch<ApiWeeklyBriefing>('/digest/briefing', { token })
}

export function fetchPriorityInsights(
  token: string,
  limit = 20,
): Promise<ApiPriorityInsightsResponse> {
  return apiFetch<ApiPriorityInsightsResponse>(`/priorities/insights?limit=${limit}`, { token })
}

export function fetchComplaintThemes(
  token: string,
  days = 14,
): Promise<ApiComplaintThemesResponse> {
  return apiFetch<ApiComplaintThemesResponse>(`/complaints/themes?days=${days}`, { token })
}
