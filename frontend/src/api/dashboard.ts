import { apiFetch } from './httpClient'
import type { ApiDashboardResponse } from './types/dashboard'

export function fetchDashboard(token: string): Promise<ApiDashboardResponse> {
  return apiFetch<ApiDashboardResponse>('/dashboard', { token })
}
