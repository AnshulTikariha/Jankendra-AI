import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Map, useMap } from '@vis.gl/react-google-maps'
import { GOOGLE_MAP_ID } from '../../config/googleMaps'
import {
  INDIA_MAP_VIEW,
  getIntensityColor,
  getIntensityLabel,
  intensityLegend,
  type WardMapPoint,
  wardMapPoints,
} from '../../data/wardMapData'

type Props = {
  wards?: WardMapPoint[]
  mapLabel?: string
}

type MapLayer = 'combined' | 'complaints' | 'commitments'

function layerIntensity(ward: WardMapPoint, layer: MapLayer): number {
  if (layer === 'complaints') {
    return Math.min(100, Math.round((ward.openComplaints / 20) * 100))
  }
  if (layer === 'commitments') {
    return Math.min(100, Math.round((ward.overdueCommitments / 5) * 100))
  }
  return ward.intensity
}

function isGoogleMapsReady(): boolean {
  return typeof google !== 'undefined' && Boolean(google.maps)
}

function wardMarkerIcon(
  color: string,
  isSelected: boolean,
  scale = 8,
): google.maps.Symbol {
  return {
    path: google.maps.SymbolPath.CIRCLE,
    scale: isSelected ? scale + 3 : scale,
    fillColor: color,
    fillOpacity: scale > 10 ? 0.35 : 0.95,
    strokeColor: scale > 10 ? color : isSelected ? '#ffffff' : '#0f172a',
    strokeWeight: scale > 10 ? 0 : isSelected ? 3 : 2,
  }
}

export function IssueHeatMap({ wards = wardMapPoints, mapLabel }: Props) {
  const [selectedId, setSelectedId] = useState<string>(wards[0]?.wardId ?? '')
  const [layer, setLayer] = useState<MapLayer>('combined')
  const [map, setMap] = useState<google.maps.Map | null>(null)

  useEffect(() => {
    if (!wards.some((ward) => ward.wardId === selectedId)) {
      setSelectedId(wards[0]?.wardId ?? '')
    }
  }, [selectedId, wards])

  const selected = useMemo(
    () => wards.find((w) => w.wardId === selectedId) ?? wards[0],
    [selectedId, wards],
  )

  const layers: MapLayer[] = ['combined', 'complaints', 'commitments']
  const hasWards = wards.length > 0

  return (
    <section className="overflow-hidden rounded-3xl border border-line/80 bg-white shadow-md shadow-slate-200/50">
      <div className="border-b border-line/80 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 px-5 py-4 text-white sm:px-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-cyan-300">Live constituency map</p>
            <h2 className="mt-1 text-xl font-extrabold">Issue intensity radar</h2>
            <p className="mt-1 text-sm text-slate-300">
              Google Maps — monsoon-style heat zones over ward locations
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {layers.map((item) => (
              <button
                className={`rounded-full px-3 py-1.5 text-xs font-bold transition ${
                  layer === item
                    ? 'bg-cyan-400 text-slate-900'
                    : 'bg-white/10 text-white/80 hover:bg-white/20'
                }`}
                key={item}
                onClick={() => setLayer(item)}
                type="button"
              >
                {item === 'combined' ? 'Combined' : item === 'complaints' ? 'Complaints' : 'Commitments'}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid gap-0 lg:grid-cols-[1fr_20rem]">
        <div className="relative bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4 sm:p-6">
          {hasWards ? (
            <IndianHeatMap
              layer={layer}
              mapLabel={mapLabel}
              onMapReady={setMap}
              onSelect={setSelectedId}
              selectedId={selectedId}
              wards={wards}
            />
          ) : (
            <div className="flex h-[26rem] items-center justify-center rounded-2xl border border-dashed border-white/20 bg-slate-900/40 p-6 text-center sm:h-[28rem]">
              <p className="max-w-sm text-sm font-semibold text-slate-300">
                No active ward signals yet. Complaints and commitments will appear here once filed.
              </p>
            </div>
          )}
          {map && hasWards && <MapZoomToolbar map={map} wards={wards} />}
          <IntensityLegend />
        </div>

        {selected && hasWards && <WardDetailPanel layer={layer} ward={selected} />}
      </div>
    </section>
  )
}

function IndianHeatMap({
  wards,
  layer,
  selectedId,
  onSelect,
  onMapReady,
  mapLabel,
}: {
  wards: WardMapPoint[]
  layer: MapLayer
  selectedId: string
  onSelect: (id: string) => void
  onMapReady: (map: google.maps.Map) => void
  mapLabel?: string
}) {
  const initialView = useMemo(() => getInitialMapView(wards), [wards])

  return (
    <div className="issue-heat-map relative z-0 h-[26rem] w-full overflow-hidden rounded-2xl border border-white/10 sm:h-[28rem]">
      <Map
        className="size-full"
        defaultCenter={{ lat: initialView.center[0], lng: initialView.center[1] }}
        defaultZoom={initialView.zoom}
        disableDefaultUI
        gestureHandling="greedy"
        mapId={GOOGLE_MAP_ID}
        reuseMaps
      >
        <MapBridge onMapReady={onMapReady} />
        <FitMapBounds wards={wards} />
        <HeatMapOverlays layer={layer} onSelect={onSelect} selectedId={selectedId} wards={wards} />
        <FlyToWard selectedId={selectedId} wards={wards} />
      </Map>

      <div className="pointer-events-none absolute left-3 top-3 z-[1000] rounded-lg bg-slate-900/80 px-2 py-1 text-[0.65rem] font-bold uppercase tracking-wide text-cyan-200 backdrop-blur-sm">
        {mapLabel ?? 'India · Active wards'}
      </div>
    </div>
  )
}

function getInitialMapView(wards: WardMapPoint[]): { center: [number, number]; zoom: number } {
  if (wards.length === 0) {
    return { center: INDIA_MAP_VIEW.center, zoom: INDIA_MAP_VIEW.zoom }
  }

  const lats = wards.map((ward) => ward.lat)
  const lngs = wards.map((ward) => ward.lng)
  const latSpan = Math.max(...lats) - Math.min(...lats)
  const lngSpan = Math.max(...lngs) - Math.min(...lngs)

  if (latSpan > 2 || lngSpan > 2) {
    return { center: INDIA_MAP_VIEW.center, zoom: INDIA_MAP_VIEW.zoom }
  }

  const centerLat = lats.reduce((sum, value) => sum + value, 0) / lats.length
  const centerLng = lngs.reduce((sum, value) => sum + value, 0) / lngs.length
  return {
    center: [centerLat, centerLng],
    zoom: wards.length === 1 ? 13 : 11,
  }
}

function FitMapBounds({ wards }: { wards: WardMapPoint[] }) {
  const map = useMap()

  useEffect(() => {
    if (!map || wards.length === 0) return

    if (wards.length === 1) {
      map.panTo({ lat: wards[0].lat, lng: wards[0].lng })
      map.setZoom(12)
      return
    }

    const bounds = new google.maps.LatLngBounds()
    wards.forEach((ward) => bounds.extend({ lat: ward.lat, lng: ward.lng }))
    map.fitBounds(bounds, { top: 48, right: 48, bottom: 48, left: 48 })

    const listener = google.maps.event.addListenerOnce(map, 'idle', () => {
      const zoom = map.getZoom()
      if (zoom != null && zoom > 11) {
        map.setZoom(11)
      }
    })

    return () => {
      google.maps.event.removeListener(listener)
    }
  }, [map, wards])

  return null
}

function MapBridge({ onMapReady }: { onMapReady: (map: google.maps.Map) => void }) {
  const map = useMap()
  useEffect(() => {
    if (map) onMapReady(map)
  }, [map, onMapReady])
  return null
}

function HeatMapOverlays({
  wards,
  layer,
  selectedId,
  onSelect,
}: {
  wards: WardMapPoint[]
  layer: MapLayer
  selectedId: string
  onSelect: (id: string) => void
}) {
  const map = useMap()
  const markersRef = useRef<google.maps.Marker[]>([])
  const onSelectRef = useRef(onSelect)
  onSelectRef.current = onSelect

  useEffect(() => {
    if (!map || !isGoogleMapsReady()) return

    markersRef.current.forEach((marker) => marker.setMap(null))
    markersRef.current = []

    const listeners: google.maps.MapsEventListener[] = []

    wards.forEach((ward) => {
      const intensity = layerIntensity(ward, layer)
      const color = getIntensityColor(intensity)
      const isSelected = ward.wardId === selectedId
      const center = { lat: ward.lat, lng: ward.lng }
      const haloScale = 14 + Math.round((intensity / 100) * 18)

      if (intensity > 0) {
        const halo = new google.maps.Marker({
          position: center,
          map,
          clickable: false,
          zIndex: 1,
          icon: wardMarkerIcon(color, false, haloScale),
        })
        markersRef.current.push(halo)
      }

      const marker = new google.maps.Marker({
        position: center,
        map,
        title: ward.wardName,
        zIndex: isSelected ? 20 : 10,
        icon: wardMarkerIcon(color, isSelected),
      })
      markersRef.current.push(marker)

      const listener = marker.addListener('click', () => onSelectRef.current(ward.wardId))
      listeners.push(listener)
    })

    return () => {
      listeners.forEach((listener) => listener.remove())
      markersRef.current.forEach((marker) => marker.setMap(null))
      markersRef.current = []
    }
  }, [map, wards, layer, selectedId])

  return null
}

function FlyToWard({
  selectedId,
  wards,
}: {
  selectedId: string
  wards: WardMapPoint[]
}) {
  const map = useMap()
  const initialFlySkipped = useRef(false)

  useEffect(() => {
    const ward = wards.find((w) => w.wardId === selectedId)
    if (!ward || !map) return

    if (!initialFlySkipped.current) {
      initialFlySkipped.current = true
      return
    }

    map.panTo({ lat: ward.lat, lng: ward.lng })
    const currentZoom = map.getZoom() ?? 5
    map.setZoom(currentZoom < 10 ? 10 : Math.max(currentZoom, 12))
  }, [map, selectedId, wards])

  return null
}

function MapZoomToolbar({ map, wards }: { map: google.maps.Map; wards: WardMapPoint[] }) {
  const fitConstituency = useCallback(() => {
    const bounds = new google.maps.LatLngBounds()
    wards.forEach((ward) => bounds.extend({ lat: ward.lat, lng: ward.lng }))
    map.fitBounds(bounds, { top: 48, right: 48, bottom: 48, left: 48 })
  }, [map, wards])

  const viewIndia = useCallback(() => {
    map.panTo({ lat: INDIA_MAP_VIEW.center[0], lng: INDIA_MAP_VIEW.center[1] })
    map.setZoom(INDIA_MAP_VIEW.zoom)
  }, [map])

  return (
    <div className="absolute right-3 top-3 z-[1000] flex flex-col gap-1.5">
      <ZoomButton label="Zoom in" onClick={() => map.setZoom((map.getZoom() ?? 12) + 1)}>
        +
      </ZoomButton>
      <ZoomButton label="Zoom out" onClick={() => map.setZoom((map.getZoom() ?? 12) - 1)}>
        −
      </ZoomButton>
      <div className="my-0.5 h-px bg-white/20" />
      <ZoomButton label="Fit constituency" onClick={fitConstituency}>
        Ward
      </ZoomButton>
      <ZoomButton label="View India" onClick={viewIndia}>
        India
      </ZoomButton>
    </div>
  )
}

function ZoomButton({
  children,
  label,
  onClick,
}: {
  children: React.ReactNode
  label: string
  onClick: () => void
}) {
  return (
    <button
      aria-label={label}
      className="grid min-w-[2.75rem] place-items-center rounded-xl border border-white/15 bg-slate-900/90 px-3 py-2 text-sm font-extrabold text-white shadow-lg backdrop-blur-sm transition hover:bg-slate-800"
      onClick={onClick}
      title={label}
      type="button"
    >
      {children}
    </button>
  )
}

function IntensityLegend() {
  return (
    <div className="mt-4 rounded-xl border border-white/10 bg-black/30 p-3 backdrop-blur-sm">
      <p className="text-[0.65rem] font-bold uppercase tracking-wide text-slate-400">Intensity scale</p>
      <div className="mt-2 flex h-3 overflow-hidden rounded-full">
        {intensityLegend.map((item) => (
          <div className="flex-1" key={item.label} style={{ backgroundColor: item.color }} title={item.label} />
        ))}
      </div>
      <div className="mt-1.5 flex justify-between text-[0.6rem] font-semibold text-slate-400">
        <span>Minimal</span>
        <span>Critical</span>
      </div>
    </div>
  )
}

function WardDetailPanel({ ward, layer }: { ward: WardMapPoint; layer: MapLayer }) {
  const intensity = layerIntensity(ward, layer)
  const color = getIntensityColor(intensity)
  const label = getIntensityLabel(intensity)

  return (
    <aside className="border-t border-line/80 bg-white lg:border-l lg:border-t-0">
      <div className="border-b border-line/80 bg-gradient-to-r from-slate-50 to-white px-5 py-4">
        <p className="text-xs font-bold uppercase tracking-wide text-muted">Ward details</p>
        <h3 className="mt-1 text-lg font-extrabold">{ward.wardName}</h3>
        <p className="mt-1 font-mono text-xs text-muted">
          {ward.lat.toFixed(4)}°N, {ward.lng.toFixed(4)}°E
        </p>
        <div
          className="mt-3 inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-bold text-white"
          style={{ backgroundColor: color }}
        >
          <span className="size-2 rounded-full bg-white/80" />
          {label} · {intensity}%
        </div>
      </div>

      <div className="max-h-[28rem] space-y-4 overflow-y-auto p-5">
        <div className="grid grid-cols-2 gap-3">
          <MetricCard label="Open clusters" value={ward.openClusters} />
          <MetricCard label="Open complaints" value={ward.openComplaints} />
          <MetricCard label="Overdue" value={ward.overdueCommitments} />
          <MetricCard label="Resolved (7d)" value={ward.resolvedThisWeek} />
        </div>

        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-muted">Category breakdown</p>
          <ul className="mt-2 space-y-2">
            {ward.categories.map((cat) => (
              <li className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2" key={cat.label}>
                <span className="text-sm font-semibold text-ink">{cat.label}</span>
                <span className="rounded-full bg-white px-2 py-0.5 text-xs font-bold text-muted">{cat.count}</span>
              </li>
            ))}
          </ul>
        </div>

        {ward.infraAlerts.length > 0 && (
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-muted">Infra alerts</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {ward.infraAlerts.map((alert) => (
                <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-800" key={alert}>
                  {alert}
                </span>
              ))}
            </div>
          </div>
        )}

        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-muted">Top issues</p>
          <ul className="mt-2 space-y-2">
            {ward.topIssues.map((issue) => (
              <li className="rounded-xl border border-line/80 px-3 py-2 text-sm font-medium text-ink" key={issue}>
                {issue}
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-xl bg-cyan-50 px-3 py-3">
          <p className="text-[0.65rem] font-bold uppercase tracking-wide text-cyan-700">Latest signal</p>
          <p className="mt-1 text-sm font-semibold text-cyan-900">{ward.recentSummary}</p>
        </div>
      </div>
    </aside>
  )
}

function MetricCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-line/80 bg-white p-3 text-center shadow-sm">
      <p className="text-[0.65rem] font-bold uppercase tracking-wide text-muted">{label}</p>
      <p className="mt-1 text-xl font-extrabold text-ink">{value}</p>
    </div>
  )
}
