import { apiFetch } from './httpClient'
import type {
  ApiCityListResponse,
  ApiWardBoundariesResponse,
  ApiWardBoundaryResponse,
  ApiWardListResponse,
  ApiWardResolveResponse,
} from './types/constituency'

export function fetchCities(token: string): Promise<ApiCityListResponse> {
  return apiFetch<ApiCityListResponse>('/constituency/cities', { token })
}

export function fetchWards(token: string, city?: string): Promise<ApiWardListResponse> {
  const query = city ? `?city=${encodeURIComponent(city)}` : ''
  return apiFetch<ApiWardListResponse>(`/constituency/wards${query}`, { token })
}

export function resolveWard(
  token: string,
  latitude: number,
  longitude: number,
  city?: string,
): Promise<ApiWardResolveResponse> {
  const params = new URLSearchParams({
    latitude: String(latitude),
    longitude: String(longitude),
  })
  if (city) params.set('city', city)
  return apiFetch<ApiWardResolveResponse>(`/constituency/wards/resolve?${params}`, { token })
}

export function fetchWardBoundaries(
  token: string,
  city?: string,
): Promise<ApiWardBoundariesResponse> {
  const query = city ? `?city=${encodeURIComponent(city)}` : ''
  return apiFetch<ApiWardBoundariesResponse>(`/constituency/ward-boundaries${query}`, { token })
}

export function fetchWardBoundary(
  token: string,
  wardId: number,
): Promise<ApiWardBoundaryResponse> {
  return apiFetch<ApiWardBoundaryResponse>(`/constituency/wards/${wardId}/boundary`, { token })
}
