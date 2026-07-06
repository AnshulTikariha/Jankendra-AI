import { GOOGLE_MAPS_API_KEY } from '../config/googleMaps'
import type { DevicePosition } from './deviceGeolocation'

type GoogleGeolocateResponse = {
  location?: { lat: number; lng: number }
  accuracy?: number
  error?: { message?: string }
}

export async function geolocateByGoogleIp(): Promise<
  | { ok: true; position: DevicePosition; accuracyMeters?: number }
  | { ok: false }
> {
  if (!GOOGLE_MAPS_API_KEY) {
    return { ok: false }
  }

  try {
    const response = await fetch(
      `https://www.googleapis.com/geolocation/v1/geolocate?key=${encodeURIComponent(GOOGLE_MAPS_API_KEY)}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ considerIp: true }),
      },
    )

    const payload = (await response.json()) as GoogleGeolocateResponse
    const lat = payload.location?.lat
    const lng = payload.location?.lng

    if (!response.ok || lat == null || lng == null) {
      return { ok: false }
    }

    return {
      ok: true,
      position: { latitude: lat, longitude: lng },
      accuracyMeters: payload.accuracy,
    }
  } catch {
    return { ok: false }
  }
}
