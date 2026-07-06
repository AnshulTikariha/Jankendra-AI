import type { CityOption } from '../api/types/constituency'

/** Mirrors backend `municipal_layers` — used when /constituency/cities is unavailable. */
export const FALLBACK_CITY_OPTIONS: CityOption[] = [
  {
    city: 'bengaluru',
    displayName: 'Bengaluru (BBMP)',
    defaultLat: 12.9716,
    defaultLng: 77.5946,
    defaultZoom: 11,
    wardCount: 0,
  },
  {
    city: 'kanpur',
    displayName: 'Kanpur',
    defaultLat: 26.4499,
    defaultLng: 80.3319,
    defaultZoom: 12,
    wardCount: 0,
  },
  {
    city: 'bhopal',
    displayName: 'Bhopal',
    defaultLat: 23.2599,
    defaultLng: 77.4126,
    defaultZoom: 12,
    wardCount: 0,
  },
]
