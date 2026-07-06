import { geolocateByGoogleIp } from './googleIpGeolocation'

export type DevicePosition = {
  latitude: number
  longitude: number
}

export type DevicePositionErrorCode =
  | 'unsupported'
  | 'permission-denied'
  | 'unavailable'
  | 'timeout'

export type PositionSource = 'gps' | 'ip'

export type DevicePositionResult =
  | { ok: true; position: DevicePosition; source: PositionSource }
  | { ok: false; code: DevicePositionErrorCode }

function readPosition(options: PositionOptions): Promise<DevicePositionResult> {
  return new Promise((resolve) => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      resolve({ ok: false, code: 'unsupported' })
      return
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          ok: true,
          source: 'gps',
          position: {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          },
        })
      },
      (error) => {
        if (error.code === error.PERMISSION_DENIED) {
          resolve({ ok: false, code: 'permission-denied' })
          return
        }
        if (error.code === error.TIMEOUT) {
          resolve({ ok: false, code: 'timeout' })
          return
        }
        resolve({ ok: false, code: 'unavailable' })
      },
      options,
    )
  })
}

/**
 * Best-effort user position:
 * 1) cached/low-accuracy GPS (one attempt — avoids macOS CoreLocation spam)
 * 2) Google IP geolocation (works when GPS returns kCLErrorLocationUnknown)
 */
export async function resolveUserPosition(): Promise<DevicePositionResult> {
  if (typeof navigator !== 'undefined' && navigator.geolocation) {
    const cachedGps = await readPosition({
      enableHighAccuracy: false,
      timeout: 10_000,
      maximumAge: 300_000,
    })
    if (cachedGps.ok) {
      return cachedGps
    }

    if (cachedGps.code !== 'permission-denied' && cachedGps.code !== 'unsupported') {
      const freshGps = await readPosition({
        enableHighAccuracy: true,
        timeout: 12_000,
        maximumAge: 0,
      })
      if (freshGps.ok) {
        return freshGps
      }
    }
  }

  const ipResult = await geolocateByGoogleIp()
  if (ipResult.ok) {
    return {
      ok: true,
      source: 'ip',
      position: ipResult.position,
    }
  }

  if (typeof navigator === 'undefined' || !navigator.geolocation) {
    return { ok: false, code: 'unsupported' }
  }

  return { ok: false, code: 'unavailable' }
}

/** @deprecated Use resolveUserPosition */
export async function getDevicePosition(): Promise<DevicePositionResult> {
  return resolveUserPosition()
}
