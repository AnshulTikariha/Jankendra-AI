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

export type ExploreComplaintsParams = {
  latitude: number
  longitude: number
  radiusKm?: number
  wardId?: number
  dateFrom?: string
  dateTo?: string
  q?: string
  limit?: number
}

export function fetchExploreComplaints(
  token: string,
  params: ExploreComplaintsParams,
): Promise<ApiComplaintListResponse> {
  const search = new URLSearchParams({
    latitude: String(params.latitude),
    longitude: String(params.longitude),
    radius_km: String(params.radiusKm ?? 50),
  })
  if (params.wardId !== undefined) search.set('ward_id', String(params.wardId))
  if (params.dateFrom) search.set('date_from', params.dateFrom)
  if (params.dateTo) search.set('date_to', params.dateTo)
  if (params.q?.trim()) search.set('q', params.q.trim())
  if (params.limit !== undefined) search.set('limit', String(params.limit))
  return apiFetch<ApiComplaintListResponse>(`/complaints/explore?${search}`, { token })
}

export function fetchExploreComplaintById(
  token: string,
  complaintId: string,
  latitude: number,
  longitude: number,
  radiusKm = 50,
): Promise<ApiComplaint> {
  const search = new URLSearchParams({
    latitude: String(latitude),
    longitude: String(longitude),
    radius_km: String(radiusKm),
  })
  return apiFetch<ApiComplaint>(`/complaints/explore/${complaintId}?${search}`, { token })
}

export function fetchComplaintById(token: string, complaintId: string): Promise<ApiComplaint> {
  return apiFetch<ApiComplaint>(`/complaints/${complaintId}`, { token })
}
