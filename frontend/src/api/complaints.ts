import { apiFetch } from './httpClient'
import type {
  ApiComplaint,
  ApiComplaintListResponse,
  CreateComplaintPayload,
} from './types/complaints'

export function createComplaint(
  token: string,
  payload: CreateComplaintPayload,
): Promise<ApiComplaint> {
  return apiFetch<ApiComplaint>('/complaints', {
    method: 'POST',
    token,
    body: JSON.stringify(payload),
  })
}

export function fetchComplaints(
  token: string,
  wardId?: number,
): Promise<ApiComplaintListResponse> {
  const query = wardId !== undefined ? `?ward_id=${wardId}` : ''
  return apiFetch<ApiComplaintListResponse>(`/complaints${query}`, { token })
}

export function fetchComplaintById(token: string, complaintId: string): Promise<ApiComplaint> {
  return apiFetch<ApiComplaint>(`/complaints/${complaintId}`, { token })
}
