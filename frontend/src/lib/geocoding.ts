export type GeocodingResult = {
  placeId: string
  label: string
  latitude: number
  longitude: number
}

const NOMINATIM_BASE = 'https://nominatim.openstreetmap.org'
const USER_AGENT = 'JankendraAI/1.0 (citizen complaint app)'

type NominatimSearchItem = {
  place_id: number
  display_name: string
  lat: string
  lon: string
}

type NominatimReverseResult = {
  display_name?: string
}

async function nominatimFetch<T>(path: string): Promise<T> {
  const response = await fetch(`${NOMINATIM_BASE}${path}`, {
    headers: {
      Accept: 'application/json',
      'Accept-Language': 'en',
      'User-Agent': USER_AGENT,
    },
  })

  if (!response.ok) {
    throw new Error('Geocoding request failed')
  }

  return response.json() as Promise<T>
}

export async function searchPlaces(
  query: string,
  bias?: { lat: number; lng: number; cityName?: string },
): Promise<GeocodingResult[]> {
  const trimmed = query.trim()
  if (trimmed.length < 2) return []

  const searchText = bias?.cityName ? `${trimmed}, ${bias.cityName}, India` : trimmed

  const params = new URLSearchParams({
    q: searchText,
    format: 'json',
    addressdetails: '1',
    limit: '6',
    countrycodes: 'in',
  })

  if (bias) {
    const delta = 0.45
    params.set(
      'viewbox',
      `${bias.lng - delta},${bias.lat + delta},${bias.lng + delta},${bias.lat - delta}`,
    )
    params.set('bounded', '1')
  }

  const results = await nominatimFetch<NominatimSearchItem[]>(`/search?${params}`)

  return results.map((item) => ({
    placeId: String(item.place_id),
    label: item.display_name,
    latitude: Number(item.lat),
    longitude: Number(item.lon),
  }))
}

export async function reverseGeocode(latitude: number, longitude: number): Promise<string | null> {
  const params = new URLSearchParams({
    lat: String(latitude),
    lon: String(longitude),
    format: 'json',
    addressdetails: '1',
  })

  const result = await nominatimFetch<NominatimReverseResult>(`/reverse?${params}`)
  return result.display_name?.trim() ?? null
}
