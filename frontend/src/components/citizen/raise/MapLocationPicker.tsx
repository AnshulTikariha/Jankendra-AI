import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Map, useMap, useMapsLibrary } from '@vis.gl/react-google-maps'
import { useTranslation } from 'react-i18next'
import { GOOGLE_MAPS_API_KEY } from '../../../config/googleMaps'
import { GOOGLE_MAP_ID } from '../../../config/googleMaps'
import { useGooglePlaceAutocomplete } from '../../../hooks/useGooglePlaceAutocomplete'
import { boundsFromGeoJsonGeometry } from '../../../lib/googleMapGeo'
import { fetchGooglePlaceDetails, reverseGeocodeWithGoogle } from '../../../lib/googleGeocoding'
import { resolveUserPosition, type DevicePositionErrorCode } from '../../../lib/deviceGeolocation'
import { formatCoordinates } from '../../../lib/raiseComplaintFormat'

export type MapLocationValue = {
  latitude: number | null
  longitude: number | null
  locationDetail: string
}

export type MapViewConfig = {
  center: [number, number]
  zoom: number
}

type Props = {
  value: MapLocationValue
  onChange: (value: MapLocationValue) => void
  mapView: MapViewConfig
  wardFocus?: { lat: number; lng: number } | null
  wardBoundary?: Record<string, unknown> | null
  searchBias?: { lat: number; lng: number; cityName?: string }
  searchSeed?: string | null
  deviceLocateRequest?: number
  onDeviceLocateFailed?: (code: DevicePositionErrorCode) => void
}

function MapCamera({
  position,
  zoom,
  fitBoundary,
}: {
  position: { lat: number; lng: number } | null
  zoom?: number
  fitBoundary?: Record<string, unknown> | null
}) {
  const map = useMap()

  useEffect(() => {
    if (!map) return

    if (fitBoundary) {
      const bounds = boundsFromGeoJsonGeometry(fitBoundary)
      if (bounds) {
        map.fitBounds(bounds, { top: 28, right: 28, bottom: 28, left: 28 })
        return
      }
    }

    if (!position) return
    map.panTo(position)
    map.setZoom(zoom ?? Math.max(map.getZoom() ?? 15, 15))
  }, [map, position, zoom, fitBoundary])

  return null
}

function WardBoundaryLayer({ boundary }: { boundary: Record<string, unknown> | null }) {
  const map = useMap()

  useEffect(() => {
    if (!map || !boundary) return

    const layer = new google.maps.Data()
    layer.addGeoJson({ type: 'Feature', geometry: boundary })
    layer.setStyle({
      strokeColor: '#0d9488',
      strokeWeight: 2,
      fillColor: '#14b8a6',
      fillOpacity: 0.12,
    })
    layer.setMap(map)

    return () => layer.setMap(null)
  }, [map, boundary])

  return null
}

function DraggableMarker({
  position,
  onMove,
}: {
  position: { lat: number; lng: number }
  onMove: (lat: number, lng: number) => void
}) {
  const map = useMap()
  const markerRef = useRef<google.maps.Marker | null>(null)
  const onMoveRef = useRef(onMove)
  onMoveRef.current = onMove

  useEffect(() => {
    if (!map) return

    const marker = new google.maps.Marker({
      position,
      map,
      draggable: true,
    })
    markerRef.current = marker

    const listener = marker.addListener('dragend', () => {
      const next = marker.getPosition()
      if (next) onMoveRef.current(next.lat(), next.lng())
    })

    return () => {
      listener.remove()
      marker.setMap(null)
      markerRef.current = null
    }
  }, [map])

  useEffect(() => {
    markerRef.current?.setPosition(position)
  }, [position])

  return null
}

export function MapLocationPicker({
  value,
  onChange,
  mapView,
  wardFocus = null,
  wardBoundary = null,
  searchBias,
  searchSeed = null,
  deviceLocateRequest = 0,
  onDeviceLocateFailed,
}: Props) {
  const { t } = useTranslation('complaints')
  if (!GOOGLE_MAPS_API_KEY) {
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50/60 p-4">
        <p className="text-sm font-bold text-amber-900">{t('raise.where.map.title')}</p>
        <p className="mt-1 text-xs text-amber-800">
          Map is temporarily unavailable because Google Maps key is not configured.
        </p>
        <label className="mt-4 block">
          <span className="text-sm font-bold text-amber-900">
            {t('raise.where.location')}{' '}
            <span className="font-normal text-amber-700">{t('raise.where.locationOptional')}</span>
          </span>
          <p className="mt-0.5 text-xs text-amber-800">{t('raise.where.map.addressHint')}</p>
          <textarea
            className="mt-2 w-full rounded-xl border border-amber-200 bg-white px-4 py-3 text-sm font-medium outline-none focus:ring-4 focus:ring-amber-200/40"
            onChange={(event) =>
              onChange({
                ...value,
                locationDetail: event.target.value,
              })
            }
            placeholder={t('raise.where.locationPlaceholder')}
            rows={2}
            value={value.locationDetail}
          />
        </label>
      </div>
    )
  }

  const placesLib = useMapsLibrary('places')
  const [searchQuery, setSearchQuery] = useState('')
  const [searchOpen, setSearchOpen] = useState(false)
  const [geoLoading, setGeoLoading] = useState(false)
  const [addressLoading, setAddressLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [locationHint, setLocationHint] = useState<string | null>(null)
  const [flyTarget, setFlyTarget] = useState<{ lat: number; lng: number } | null>(null)
  const [flyZoom, setFlyZoom] = useState<number | undefined>(undefined)
  const [fitBoundary, setFitBoundary] = useState<Record<string, unknown> | null>(null)
  const wardFocusKey = useRef<string>('')
  const lockSearchSuggestionsRef = useRef(false)
  const searchInputRef = useRef<HTMLInputElement>(null)
  const deviceLocateRequestRef = useRef(0)

  const geoErrorMessage = useCallback(
    (code: DevicePositionErrorCode) => {
      switch (code) {
        case 'unsupported':
          return t('raise.where.geo.unsupported')
        case 'permission-denied':
          return t('raise.where.geo.denied')
        case 'timeout':
        case 'unavailable':
        default:
          return t('raise.where.geo.unavailable')
      }
    },
    [t],
  )

  useEffect(() => {
    if (searchSeed?.trim()) {
      lockSearchSuggestionsRef.current = true
      setSearchQuery(searchSeed.trim())
      setSearchOpen(false)
      searchInputRef.current?.blur()
    }
  }, [searchSeed])

  useEffect(() => {
    if (value.latitude != null && value.longitude != null) {
      lockSearchSuggestionsRef.current = true
      setFitBoundary(null)
      setFlyTarget({ lat: value.latitude, lng: value.longitude })
      setFlyZoom(16)
      setSearchOpen(false)
      searchInputRef.current?.blur()
    }
  }, [value.latitude, value.longitude])

  const { suggestions, loading: searchLoading, placesReady } = useGooglePlaceAutocomplete(
    searchQuery,
    searchBias,
  )

  const hasPin = value.latitude != null && value.longitude != null
  const markerPosition = useMemo(() => {
    if (!hasPin) return null
    return { lat: value.latitude!, lng: value.longitude! }
  }, [hasPin, value.latitude, value.longitude])

  useEffect(() => {
    if (!wardFocus) return
    const key = `${wardFocus.lat},${wardFocus.lng}:${wardBoundary ? 'b' : ''}`
    if (wardFocusKey.current === key) return
    wardFocusKey.current = key

    if (wardBoundary) {
      setFitBoundary(wardBoundary)
      setFlyTarget(null)
      setFlyZoom(undefined)
      return
    }

    setFitBoundary(null)
    setFlyTarget({ lat: wardFocus.lat, lng: wardFocus.lng })
    setFlyZoom(15)
  }, [wardFocus, wardBoundary])

  useEffect(() => {
    wardFocusKey.current = ''
  }, [mapView.center[0], mapView.center[1], mapView.zoom])

  const applyPin = useCallback(
    async (latitude: number, longitude: number, address?: string) => {
      setError(null)
      setFitBoundary(null)
      setFlyTarget({ lat: latitude, lng: longitude })
      setFlyZoom(16)

      if (address) {
        setSearchOpen(false)
        onChange({ latitude, longitude, locationDetail: address })
        return
      }

      setAddressLoading(true)
      try {
        const resolved = await reverseGeocodeWithGoogle(latitude, longitude)
        onChange({
          latitude,
          longitude,
          locationDetail: resolved ?? value.locationDetail,
        })
      } catch {
        onChange({ latitude, longitude, locationDetail: value.locationDetail })
        setError(t('raise.where.map.addressError'))
      } finally {
        setAddressLoading(false)
      }
    },
    [onChange, t, value.locationDetail],
  )

  const captureCurrentLocation = useCallback(async () => {
    setGeoLoading(true)
    setError(null)
    setLocationHint(null)

    const result = await resolveUserPosition()
    if (!result.ok) {
      const message = geoErrorMessage(result.code)
      setError(message)
      onDeviceLocateFailed?.(result.code)
      setGeoLoading(false)
      return false
    }

    if (result.source === 'ip') {
      setLocationHint(t('raise.where.geo.approximate'))
    }

    lockSearchSuggestionsRef.current = true
    await applyPin(result.position.latitude, result.position.longitude)
    setGeoLoading(false)
    return true
  }, [applyPin, geoErrorMessage, onDeviceLocateFailed, t])

  useEffect(() => {
    if (!deviceLocateRequest || deviceLocateRequestRef.current === deviceLocateRequest) {
      return
    }
    deviceLocateRequestRef.current = deviceLocateRequest
    if (value.latitude != null && value.longitude != null) {
      return
    }
    void captureCurrentLocation()
  }, [captureCurrentLocation, deviceLocateRequest, value.latitude, value.longitude])

  useEffect(() => {
    if (lockSearchSuggestionsRef.current) {
      setSearchOpen(false)
      return
    }

    if (suggestions.length > 0 && searchQuery.trim().length >= 2) {
      setSearchOpen(true)
    } else if (suggestions.length === 0 && !searchLoading) {
      setSearchOpen(false)
    }
  }, [suggestions, searchQuery, searchLoading])

  const handleSearchSelect = async (placeId: string, label: string) => {
    if (!placesLib) {
      setError(t('raise.where.map.searchError'))
      return
    }

    lockSearchSuggestionsRef.current = true
    setSearchQuery(label.split(',')[0] ?? label)
    setSearchOpen(false)
    setError(null)

    try {
      const place = await fetchGooglePlaceDetails(placesLib, placeId)
      void applyPin(place.latitude, place.longitude, place.label)
    } catch {
      setError(t('raise.where.map.searchError'))
    }
  }

  const clearLocation = () => {
    lockSearchSuggestionsRef.current = false
    setSearchQuery('')
    setSearchOpen(false)
    setFlyTarget(null)
    setFitBoundary(null)
    setError(null)
    onChange({ latitude: null, longitude: null, locationDetail: '' })
    setLocationHint(null)
  }

  const mapsUrl =
    hasPin ? `https://www.google.com/maps?q=${value.latitude},${value.longitude}` : null

  const mapCenter = markerPosition ?? { lat: mapView.center[0], lng: mapView.center[1] }
  const mapZoom = markerPosition ? 16 : mapView.zoom

  return (
    <div className="rounded-2xl border border-line/80 bg-slate-50/50 p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="text-sm font-bold">{t('raise.where.map.title')}</p>
          <p className="mt-0.5 text-xs text-muted">{t('raise.where.map.hint')}</p>
        </div>
      </div>

      <div className="relative mt-3">
        <label className="sr-only" htmlFor="map-location-search">
          {t('raise.where.map.searchPlaceholder')}
        </label>
        <input
          className="w-full rounded-xl border border-line bg-white px-4 py-3 pr-10 text-sm font-medium outline-none focus:ring-4 focus:ring-teal-200/40"
          id="map-location-search"
          ref={searchInputRef}
          onChange={(event) => {
            lockSearchSuggestionsRef.current = false
            setSearchQuery(event.target.value)
            setError(null)
          }}
          onFocus={() => {
            if (!lockSearchSuggestionsRef.current && suggestions.length > 0) {
              setSearchOpen(true)
            }
          }}
          placeholder={t('raise.where.map.searchPlaceholder')}
          type="search"
          value={searchQuery}
        />
        {searchLoading && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-muted">
            …
          </span>
        )}

        {searchOpen && suggestions.length > 0 && (
          <ul className="absolute z-20 mt-1 max-h-48 w-full overflow-auto rounded-xl border border-line bg-white py-1 shadow-lg">
            {suggestions.map((result) => (
              <li key={result.placeId}>
                <button
                  className="w-full px-4 py-2.5 text-left text-xs font-medium text-ink hover:bg-teal-50"
                  onClick={() => void handleSearchSelect(result.placeId, result.label)}
                  type="button"
                >
                  {result.label}
                </button>
              </li>
            ))}
          </ul>
        )}
        {!placesReady && searchQuery.trim().length >= 2 && (
          <p className="mt-1 text-xs text-muted">{t('raise.where.map.searchLoading')}</p>
        )}
      </div>

      <div className="map-location-picker relative z-0 mt-3 h-56 overflow-hidden rounded-xl border border-line/80 sm:h-64">
        <Map
          className="size-full"
          defaultCenter={mapCenter}
          defaultZoom={mapZoom}
          disableDefaultUI
          gestureHandling="greedy"
          key={`${mapView.center[0]}-${mapView.center[1]}-${mapView.zoom}`}
          mapId={GOOGLE_MAP_ID}
          onClick={(event) => {
            const latLng = event.detail.latLng
            if (!latLng) return
            void applyPin(latLng.lat, latLng.lng)
          }}
          reuseMaps
        >
          <WardBoundaryLayer boundary={wardBoundary} />
          <MapCamera fitBoundary={fitBoundary} position={flyTarget} zoom={flyZoom} />
          {markerPosition && (
            <DraggableMarker
              onMove={(lat, lng) => void applyPin(lat, lng)}
              position={markerPosition}
            />
          )}
        </Map>
      </div>

      <p className="mt-2 text-xs text-muted">{t('raise.where.map.tapHint')}</p>

      <div className="mt-3 flex flex-wrap gap-2">
        <button
          className="rounded-full border border-teal-200 bg-white px-4 py-2 text-xs font-extrabold text-teal-800 disabled:opacity-60"
          disabled={geoLoading || addressLoading}
          onClick={captureCurrentLocation}
          type="button"
        >
          {geoLoading ? t('raise.where.geo.loading') : t('raise.where.geo.capture')}
        </button>
        {hasPin && (
          <button
            className="rounded-full border border-line bg-white px-4 py-2 text-xs font-extrabold text-muted"
            onClick={clearLocation}
            type="button"
          >
            {t('raise.where.geo.clear')}
          </button>
        )}
      </div>

      <label className="mt-4 block">
        <span className="text-sm font-bold">
          {t('raise.where.location')}{' '}
          <span className="font-normal text-muted">{t('raise.where.locationOptional')}</span>
        </span>
        <p className="mt-0.5 text-xs text-muted">{t('raise.where.map.addressHint')}</p>
        <textarea
          className="mt-2 w-full rounded-xl border border-line bg-white px-4 py-3 text-sm font-medium outline-none focus:ring-4 focus:ring-teal-200/40"
          onChange={(event) =>
            onChange({
              ...value,
              locationDetail: event.target.value,
            })
          }
          placeholder={t('raise.where.locationPlaceholder')}
          rows={2}
          value={value.locationDetail}
        />
      </label>

      {hasPin && (
        <div className="mt-3 space-y-1">
          <p className="font-mono text-xs font-semibold text-ink">
            {formatCoordinates(value.latitude!, value.longitude!)}
          </p>
          {addressLoading && (
            <p className="text-xs font-semibold text-muted">{t('raise.where.map.resolving')}</p>
          )}
          {mapsUrl && (
            <a
              className="inline-flex text-xs font-bold text-teal-700 underline"
              href={mapsUrl}
              rel="noopener noreferrer"
              target="_blank"
            >
              {t('raise.where.geo.openMap')}
            </a>
          )}
        </div>
      )}

      {error && <p className="mt-2 text-xs font-semibold text-red-600">{error}</p>}
      {locationHint && !error && (
        <p className="mt-2 text-xs font-semibold text-teal-800">{locationHint}</p>
      )}
    </div>
  )
}
