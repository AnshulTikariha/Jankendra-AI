import { apiFetch } from './httpClient'
import type {
  ApiCommitment,
  ApiCommitmentListResponse,
  ApiDigestResponse,
  ApiPrioritiesResponse,
  ApiTodoListResponse,
  CreateCommitmentPayload,
  TodoActionPayload,
} from './types/staff'
import type { ApiComplaint, CreateComplaintPayload } from './types/complaints'

export function fetchTodo(token: string): Promise<ApiTodoListResponse> {
  return apiFetch<ApiTodoListResponse>('/todo', { token })
}

export function patchTodoItem(
  token: string,
  commitmentId: string,
  payload: TodoActionPayload,
): Promise<ApiCommitment> {
  return apiFetch<ApiCommitment>(`/todo/${commitmentId}`, {
    method: 'PATCH',
    token,
    body: JSON.stringify(payload),
  })
}

export function fetchCommitments(
  token: string,
  status: 'all' | 'active' | 'completed' = 'all',
): Promise<ApiCommitmentListResponse> {
  const query = status === 'all' ? '' : `?status=${status}`
  return apiFetch<ApiCommitmentListResponse>(`/commitments${query}`, { token })
}

export function createCommitment(
  token: string,
  payload: CreateCommitmentPayload,
): Promise<ApiCommitment> {
  return apiFetch<ApiCommitment>('/commitments', {
    method: 'POST',
    token,
    body: JSON.stringify(payload),
  })
}

export function fetchPriorities(
  token: string,
  wardId?: number,
  limit = 20,
): Promise<ApiPrioritiesResponse> {
  const params = new URLSearchParams({ limit: String(limit) })
  if (wardId !== undefined) params.set('ward_id', String(wardId))
  return apiFetch<ApiPrioritiesResponse>(`/priorities?${params}`, { token })
}

export function fetchDigest(
  token: string,
  periodStart?: string,
  periodEnd?: string,
): Promise<ApiDigestResponse> {
  const params = new URLSearchParams()
  if (periodStart) params.set('period_start', periodStart)
  if (periodEnd) params.set('period_end', periodEnd)
  const query = params.toString() ? `?${params}` : ''
  return apiFetch<ApiDigestResponse>(`/digest${query}`, { token })
}

export { fetchWards } from './constituency'

export function createStaffComplaint(
  token: string,
  payload: CreateComplaintPayload & { citizen_contact?: string },
): Promise<ApiComplaint> {
  return apiFetch<ApiComplaint>('/complaints', {
    method: 'POST',
    token,
    body: JSON.stringify(payload),
  })
}
