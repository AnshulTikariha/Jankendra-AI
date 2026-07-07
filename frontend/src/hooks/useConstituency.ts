import { useMutation, useQuery } from '@tanstack/react-query'
import {
  fetchCities,
  fetchWardBoundaries,
  fetchWardBoundary,
  fetchWards,
  resolveWard,
} from '../api/constituency'
import type { CityOption, WardOption } from '../api/types/constituency'
import { FALLBACK_CITY_OPTIONS } from '../data/cityOptions'
import { useAuthStore } from '../stores/useAuthStore'

function mapWardOption(ward: {
  id: number
  name: string
  code: string
  city?: string | null
  population: number | null
  registered_voters: number | null
  municipal_ward_number?: string | null
  ward_area_name?: string | null
  centroid_lat?: number | null
  centroid_lng?: number | null
  has_boundary?: boolean
}): WardOption {
  return {
    id: ward.id,
    name: ward.name,
    code: ward.code,
    city: ward.city ?? null,
    population: ward.population,
    registeredVoters: ward.registered_voters,
    municipalWardNumber: ward.municipal_ward_number ?? null,
    wardAreaName: ward.ward_area_name ?? null,
    centroidLat: ward.centroid_lat ?? null,
    centroidLng: ward.centroid_lng ?? null,
    hasBoundary: Boolean(ward.has_boundary),
  }
}

export function useCities() {
  const token = useAuthStore((s) => s.session?.accessToken)

  return useQuery({
    queryKey: ['cities'],
    queryFn: async () => {
      if (!token) throw new Error('Not authenticated')
      try {
        const response = await fetchCities(token)
        const cities = response.cities.map(
          (city): CityOption => ({
            city: city.city,
            displayName: city.display_name,
            defaultLat: city.default_lat,
            defaultLng: city.default_lng,
            defaultZoom: city.default_zoom,
            wardCount: city.ward_count,
          }),
        )
        return cities.length > 0 ? cities : FALLBACK_CITY_OPTIONS
      } catch {
        return FALLBACK_CITY_OPTIONS
      }
    },
    enabled: Boolean(token),
    staleTime: 30 * 60 * 1000,
  })
}

export function useWards(city?: string) {
  const token = useAuthStore((s) => s.session?.accessToken)

  return useQuery({
    queryKey: ['wards', city ?? 'all'],
    queryFn: async () => {
      if (!token) throw new Error('Not authenticated')
      const response = await fetchWards(token, city)
      return {
        constituencyName: response.constituency_name,
        totalPopulation: response.total_population,
        totalRegisteredVoters: response.total_registered_voters,
        wards: response.wards.map(mapWardOption),
      }
    },
    enabled: Boolean(token),
    staleTime: 5 * 60 * 1000,
  })
}

export function useWardBoundaries(city?: string) {
  const token = useAuthStore((s) => s.session?.accessToken)

  return useQuery({
    queryKey: ['ward-boundaries', city ?? 'all'],
    queryFn: async () => {
      if (!token) throw new Error('Not authenticated')
      return fetchWardBoundaries(token, city)
    },
    enabled: Boolean(token),
    staleTime: 30 * 60 * 1000,
  })
}

export function useWardBoundary(wardId: number | null) {
  const token = useAuthStore((s) => s.session?.accessToken)

  return useQuery({
    queryKey: ['ward-boundary', wardId],
    queryFn: async () => {
      if (!token || wardId == null) throw new Error('Not authenticated')
      return fetchWardBoundary(token, wardId)
    },
    enabled: Boolean(token && wardId),
    staleTime: 30 * 60 * 1000,
  })
}

export function useResolveWard() {
  const token = useAuthStore((s) => s.session?.accessToken)

  return useMutation({
    mutationFn: async ({
      latitude,
      longitude,
      city,
    }: {
      latitude: number
      longitude: number
      city?: string
    }) => {
      if (!token) throw new Error('Not authenticated')
      return resolveWard(token, latitude, longitude, city)
    },
  })
}
