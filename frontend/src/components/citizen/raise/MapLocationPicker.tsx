import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import L from 'leaflet'
import {
  GeoJSON,
  MapContainer,
  Marker,
  TileLayer,
  useMap,
  useMapEvents,
} from 'react-leaflet'
import { useTranslation } from 'react-i18next'
import { formatCoordinates } from '../../../lib/raiseComplaintFormat'
import { reverseGeocode, searchPlaces, type GeocodingResult } from '../../../lib/geocoding'

const pinIcon = L.divIcon({
  className: '',
  html: `<div style="width:28px;height:28px;border-radius:50% 50% 50% 0;background:#0d9488;border:3px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,.35);transform:rotate(-45deg);margin-top:-14px;"></div>`,
  iconSize: [28, 28],
  iconAnchor: [14, 28],
})

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
}

function MapClickHandler({ onPick }: { onPick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(event) {
      onPick(event.latlng.lat, event.latlng.lng)
    },
  })
  return null
}

function MapFlyTo({
  position,
  zoom,
  fitBoundary,
}: {
  position: [number, number] | null
  zoom?: number
  fitBoundary?: Record<string, unknown> | null
}) {
  const map = useMap()

  useEffect(() => {
    if (fitBoundary) {
      const layer = L.geoJSON(fitBoundary as unknown as GeoJSON.Geometry)
      const bounds = layer.getBounds()
      if (bounds.isValid()) {
        map.fitBounds(bounds, { padding: [28, 28], maxZoom: 16, duration: 0.45 })
        return
      }
    }

    if (!position) return
    map.flyTo(position, zoom ?? Math.max(map.getZoom(), 15), { duration: 0.45 })
  }, [map, position, zoom, fitBoundary])

  return null
}

function WardBoundaryLayer({ boundary }: { boundary: Record<string, unknown> | null }) {
  if (!boundary) return null

  return (
    <GeoJSON
      data={boundary as unknown as GeoJSON.GeoJsonObject}
      pathOptions={{
        color: '#0d9488',
        weight: 2,
        fillColor: '#14b8a6',
        fillOpacity: 0.12,
      }}
    />
  )
}

export function MapLocationPicker({
  value,
  onChange,
  mapView,
  wardFocus = null,
  wardBoundary = null,
  searchBias,
}: Props) {
  const { t } = useTranslation('complaints')
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<GeocodingResult[]>([])
  const [searchLoading, setSearchLoading] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [geoLoading, setGeoLoading] = useState(false)
  const [addressLoading, setAddressLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [flyTarget, setFlyTarget] = useState<[number, number] | null>(null)
  const [flyZoom, setFlyZoom] = useState<number | undefined>(undefined)
  const [fitBoundary, setFitBoundary] = useState<Record<string, unknown> | null>(null)
  const searchSeq = useRef(0)
  const wardFocusKey = useRef<string>('')

  const hasPin = value.latitude != null && value.longitude != null
  const markerPosition = useMemo<[number, number] | null>(() => {
    if (!hasPin) return null
    return [value.latitude!, value.longitude!]
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
    setFlyTarget([wardFocus.lat, wardFocus.lng])
    setFlyZoom(15)
  }, [wardFocus, wardBoundary])

  useEffect(() => {
    wardFocusKey.current = ''
  }, [mapView.center[0], mapView.center[1], mapView.zoom])

  const applyPin = useCallback(
    async (latitude: number, longitude: number, address?: string) => {
      setError(null)
      setFitBoundary(null)
      setFlyTarget([latitude, longitude])
      setFlyZoom(16)

      if (address) {
        onChange({ latitude, longitude, locationDetail: address })
        return
      }

      setAddressLoading(true)
      try {
        const resolved = await reverseGeocode(latitude, longitude)
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

  useEffect(() => {
    const query = searchQuery.trim()
    if (query.length < 2) {
      setSearchResults([])
      setSearchLoading(false)
      return
    }

    const seq = ++searchSeq.current
    setSearchLoading(true)

    const timer = window.setTimeout(() => {
      void searchPlaces(query, searchBias)
        .then((results) => {
          if (seq !== searchSeq.current) return
          setSearchResults(results)
          setSearchOpen(true)
        })
        .catch(() => {
          if (seq !== searchSeq.current) return
          setSearchResults([])
          setError(t('raise.where.map.searchError'))
        })
        .finally(() => {
          if (seq === searchSeq.current) setSearchLoading(false)
        })
    }, 450)

    return () => window.clearTimeout(timer)
  }, [searchQuery, searchBias, t])

  const handleSearchSelect = (result: GeocodingResult) => {
    setSearchQuery(result.label.split(',')[0] ?? result.label)
    setSearchOpen(false)
    setSearchResults([])
    void applyPin(result.latitude, result.longitude, result.label)
  }

  const captureCurrentLocation = () => {
    if (!navigator.geolocation) {
      setError(t('raise.where.geo.unsupported'))
      return
    }

    setGeoLoading(true)
    setError(null)

    navigator.geolocation.getCurrentPosition(
      (position) => {
        void applyPin(position.coords.latitude, position.coords.longitude)
        setGeoLoading(false)
      },
      () => {
        setError(t('raise.where.geo.denied'))
        setGeoLoading(false)
      },
      { enableHighAccuracy: true, timeout: 15000 },
    )
  }

  const clearLocation = () => {
    setSearchQuery('')
    setSearchResults([])
    setSearchOpen(false)
    setFlyTarget(null)
    setFitBoundary(null)
    setError(null)
    onChange({ latitude: null, longitude: null, locationDetail: '' })
  }

  const mapsUrl =
    hasPin ? `https://www.google.com/maps?q=${value.latitude},${value.longitude}` : null

  const mapCenter = markerPosition ?? mapView.center
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
          onChange={(event) => {
            setSearchQuery(event.target.value)
            setError(null)
          }}
          onFocus={() => {
            if (searchResults.length > 0) setSearchOpen(true)
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

        {searchOpen && searchResults.length > 0 && (
          <ul className="absolute z-20 mt-1 max-h-48 w-full overflow-auto rounded-xl border border-line bg-white py-1 shadow-lg">
            {searchResults.map((result) => (
              <li key={result.placeId}>
                <button
                  className="w-full px-4 py-2.5 text-left text-xs font-medium text-ink hover:bg-teal-50"
                  onClick={() => handleSearchSelect(result)}
                  type="button"
                >
                  {result.label}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="map-location-picker relative z-0 mt-3 h-56 overflow-hidden rounded-xl border border-line/80 sm:h-64">
        <MapContainer
          center={mapCenter}
          className="size-full"
          key={`${mapView.center[0]}-${mapView.center[1]}-${mapView.zoom}`}
          maxZoom={18}
          minZoom={9}
          scrollWheelZoom
          zoom={mapZoom}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <WardBoundaryLayer boundary={wardBoundary} />
          <MapClickHandler onPick={(lat, lng) => void applyPin(lat, lng)} />
          <MapFlyTo fitBoundary={fitBoundary} position={flyTarget} zoom={flyZoom} />
          {markerPosition && (
            <Marker
              draggable
              eventHandlers={{
                dragend: (event) => {
                  const { lat, lng } = event.target.getLatLng()
                  void applyPin(lat, lng)
                },
              }}
              icon={pinIcon}
              position={markerPosition}
            />
          )}
        </MapContainer>
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
    </div>
  )
}
