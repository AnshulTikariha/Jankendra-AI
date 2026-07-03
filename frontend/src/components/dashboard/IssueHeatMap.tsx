import { Fragment, useEffect, useMemo, useState } from 'react'
import L from 'leaflet'
import { Circle, MapContainer, Polygon, TileLayer, Tooltip, useMap } from 'react-leaflet'
import {
  CONSTITUENCY_MAP_VIEW,
  INDIA_MAP_VIEW,
  constituencyBoundary,
  getIntensityColor,
  getIntensityLabel,
  getWardBounds,
  intensityLegend,
  type WardMapPoint,
  wardMapPoints,
} from '../../data/wardMapData'

type Props = {
  wards?: WardMapPoint[]
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

function heatRadiusMeters(intensity: number): number {
  return 350 + (intensity / 100) * 950
}

export function IssueHeatMap({ wards = wardMapPoints }: Props) {
  const [selectedId, setSelectedId] = useState<string>(wards[0]?.wardId ?? '')
  const [layer, setLayer] = useState<MapLayer>('combined')
  const [map, setMap] = useState<L.Map | null>(null)

  const selected = useMemo(
    () => wards.find((w) => w.wardId === selectedId) ?? wards[0],
    [selectedId, wards],
  )

  const layers: MapLayer[] = ['combined', 'complaints', 'commitments']

  return (
    <section className="overflow-hidden rounded-3xl border border-line/80 bg-white shadow-md shadow-slate-200/50">
      <div className="border-b border-line/80 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 px-5 py-4 text-white sm:px-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-cyan-300">Live constituency map</p>
            <h2 className="mt-1 text-xl font-extrabold">Issue intensity radar</h2>
            <p className="mt-1 text-sm text-slate-300">
              OpenStreetMap of India — monsoon-style heat zones over ward locations
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
          <IndianHeatMap
            layer={layer}
            onMapReady={setMap}
            onSelect={setSelectedId}
            selectedId={selectedId}
            wards={wards}
          />
          {map && <MapZoomToolbar map={map} wards={wards} />}
          <IntensityLegend />
        </div>

        {selected && <WardDetailPanel layer={layer} ward={selected} />}
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
}: {
  wards: WardMapPoint[]
  layer: MapLayer
  selectedId: string
  onSelect: (id: string) => void
  onMapReady: (map: L.Map) => void
}) {
  return (
    <div className="issue-heat-map relative z-0 h-[26rem] w-full overflow-hidden rounded-2xl border border-white/10 sm:h-[28rem]">
      <MapContainer
        center={CONSTITUENCY_MAP_VIEW.center}
        className="size-full"
        maxZoom={18}
        minZoom={4}
        scrollWheelZoom
        zoom={CONSTITUENCY_MAP_VIEW.zoom}
        zoomControl={false}
      >
        <MapBridge onMapReady={onMapReady} />
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <Polygon
          pathOptions={{
            color: '#22d3ee',
            dashArray: '6 8',
            fillColor: '#0ea5e9',
            fillOpacity: 0.06,
            weight: 2,
          }}
          positions={constituencyBoundary}
        />

        {wards.map((ward) => {
          const intensity = layerIntensity(ward, layer)
          const color = getIntensityColor(intensity)
          const baseRadius = heatRadiusMeters(intensity)
          const isSelected = ward.wardId === selectedId
          const center: [number, number] = [ward.lat, ward.lng]

          return (
            <Fragment key={ward.wardId}>
              {[1.35, 1, 0.65].map((scale, index) => (
                <Circle
                  center={center}
                  key={`${ward.wardId}-${scale}`}
                  pathOptions={{
                    color: 'transparent',
                    fillColor: color,
                    fillOpacity: index === 0 ? 0.14 : index === 1 ? 0.28 : 0.42,
                    weight: 0,
                  }}
                  radius={baseRadius * scale}
                />
              ))}
              <Circle
                center={center}
                eventHandlers={{
                  click: () => onSelect(ward.wardId),
                }}
                pathOptions={{
                  color: isSelected ? '#ffffff' : color,
                  fillColor: isSelected ? color : '#0f172a',
                  fillOpacity: isSelected ? 0.95 : 0.85,
                  weight: isSelected ? 3 : 2,
                }}
                radius={isSelected ? 220 : 180}
              >
                <Tooltip direction="top" offset={[0, -8]} opacity={0.95} permanent={isSelected}>
                  <span className="text-xs font-bold">
                    {ward.wardName} · {getIntensityLabel(intensity)}
                  </span>
                </Tooltip>
              </Circle>
            </Fragment>
          )
        })}

        <FlyToWard selectedId={selectedId} wards={wards} />
      </MapContainer>

      <div className="pointer-events-none absolute left-3 top-3 z-[1000] rounded-lg bg-slate-900/80 px-2 py-1 text-[0.65rem] font-bold uppercase tracking-wide text-cyan-200 backdrop-blur-sm">
        India · Bhopal constituency (demo)
      </div>
    </div>
  )
}

function MapBridge({ onMapReady }: { onMapReady: (map: L.Map) => void }) {
  const map = useMap()
  useEffect(() => {
    onMapReady(map)
  }, [map, onMapReady])
  return null
}

function FlyToWard({
  selectedId,
  wards,
}: {
  selectedId: string
  wards: WardMapPoint[]
}) {
  const leafletMap = useMap()

  useEffect(() => {
    const ward = wards.find((w) => w.wardId === selectedId)
    if (!ward) return
    leafletMap.flyTo([ward.lat, ward.lng], Math.max(leafletMap.getZoom(), 13), { duration: 0.6 })
  }, [leafletMap, selectedId, wards])

  return null
}

function MapZoomToolbar({ map, wards }: { map: L.Map; wards: WardMapPoint[] }) {
  const fitConstituency = () => {
    const bounds = L.latLngBounds(getWardBounds(wards))
    map.fitBounds(bounds.pad(0.35), { animate: true, maxZoom: 13 })
  }

  const viewIndia = () => {
    map.flyTo(INDIA_MAP_VIEW.center, INDIA_MAP_VIEW.zoom, { animate: true, duration: 0.8 })
  }

  return (
    <div className="absolute right-3 top-3 z-[1000] flex flex-col gap-1.5">
      <ZoomButton label="Zoom in" onClick={() => map.zoomIn()}>
        +
      </ZoomButton>
      <ZoomButton label="Zoom out" onClick={() => map.zoomOut()}>
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
