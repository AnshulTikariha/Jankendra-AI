import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ApiError } from '../../api/errors'
import { resolveWard } from '../../api/constituency'
import { useCities, useWards } from '../../hooks/useConstituency'
import { useExploreComplaints } from '../../hooks/useExploreComplaints'
import { resolveUserPosition } from '../../lib/deviceGeolocation'
import {
  formatComplaintWardLabel,
  getComplaintDisplayTitle,
  parseComplaintSummary,
} from '../../lib/raiseComplaintFormat'
import { isWithinRadiusKm } from '../../lib/geoDistance'
import { useAuthStore } from '../../stores/useAuthStore'
import { useUiStore } from '../../stores/useUiStore'
import {
  citizenStatusLabels,
  complaintCategoryLabels,
  type CitizenComplaintStatus,
  type Complaint,
} from '../../types/complaint'

const EXPLORE_RADIUS_KM = 50

const statusColors: Record<CitizenComplaintStatus, string> = {
  submitted: 'bg-slate-100 text-slate-700',
  under_review: 'bg-amber-100 text-amber-800',
  in_progress: 'bg-blue-100 text-blue-700',
  resolved: 'bg-emerald-100 text-emerald-800',
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

function toDateInputValue(date: Date): string {
  return date.toISOString().slice(0, 10)
}

type ExploreFilters = {
  wardId: number | ''
  dateFrom: string
  dateTo: string
  q: string
}

const defaultFilters = (): ExploreFilters => ({
  wardId: '',
  dateFrom: '',
  dateTo: '',
  q: '',
})

function ComplaintGridCard({
  complaint,
  onOpen,
  readOnlyLabel,
}: {
  complaint: Complaint
  onOpen: (id: string) => void
  readOnlyLabel: string
}) {
  const { t } = useTranslation('complaints')

  return (
    <article className="flex h-full flex-col overflow-hidden rounded-2xl border border-line/80 bg-white shadow-md transition hover:shadow-lg">
      <div className="border-b border-line/60 bg-slate-50/60 px-4 py-3">
        <div className="flex items-start justify-between gap-2">
          <p className="font-mono text-xs font-bold text-teal-700">{complaint.publicReference}</p>
          <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-[0.65rem] font-bold ${statusColors[complaint.status]}`}>
            {citizenStatusLabels[complaint.status]}
          </span>
        </div>
      </div>
      <div className="flex flex-1 flex-col p-4">
        <h3 className="line-clamp-2 text-sm font-extrabold leading-snug text-ink">
          {getComplaintDisplayTitle(complaint, complaintCategoryLabels[complaint.category])}
        </h3>
        <p className="mt-1 text-xs font-semibold text-muted">
          {formatComplaintWardLabel(complaint)} · {formatDate(complaint.submittedAt)}
        </p>
        <p className="mt-3 line-clamp-4 flex-1 text-sm leading-6 text-muted">
          {parseComplaintSummary(complaint.description)}
        </p>
        <p className="mt-3 text-[0.6rem] font-bold uppercase tracking-wide text-slate-400">
          {readOnlyLabel}
        </p>
        <button
          className="mt-3 w-full rounded-full border border-teal-200 bg-teal-50 py-2 text-xs font-extrabold text-teal-800 transition hover:bg-teal-100"
          onClick={() => onOpen(complaint.id)}
          type="button"
        >
          {t('detail.viewDetails')} →
        </button>
      </div>
    </article>
  )
}

export function WardUpdatesPage() {
  const { t } = useTranslation('complaints')
  const token = useAuthStore((s) => s.session?.accessToken)
  const setCitizenView = useUiStore((s) => s.setCitizenView)
  const setViewingComplaintId = useUiStore((s) => s.setViewingComplaintId)
  const setComplaintDetailSource = useUiStore((s) => s.setComplaintDetailSource)
  const setExploreLocation = useUiStore((s) => s.setExploreLocation)

  const { data: citiesData } = useCities()
  const [detectedCity, setDetectedCity] = useState<string | null>(null)
  const { data: wardsData } = useWards(detectedCity ?? undefined)

  const [draftFilters, setDraftFilters] = useState<ExploreFilters>(defaultFilters)
  const [appliedFilters, setAppliedFilters] = useState<ExploreFilters>(defaultFilters)
  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null)
  const [locationError, setLocationError] = useState<string | null>(null)
  const [locating, setLocating] = useState(true)

  const detectedCityLabel = useMemo(() => {
    if (!detectedCity) return null
    return citiesData?.find((item) => item.city === detectedCity)?.displayName ?? detectedCity
  }, [citiesData, detectedCity])

  useEffect(() => {
    let cancelled = false

    const loadLocation = async () => {
      setLocating(true)
      setLocationError(null)
      const result = await resolveUserPosition()
      if (cancelled) return

      if (result.ok) {
        setLocation(result.position)
      } else {
        setLocationError(t('wardUpdates.locationError'))
      }
      setLocating(false)
    }

    void loadLocation()
    return () => {
      cancelled = true
    }
  }, [t])

  useEffect(() => {
    if (!location || !token) {
      setDetectedCity(null)
      return
    }

    let cancelled = false
    void resolveWard(token, location.latitude, location.longitude)
      .then((resolved) => {
        if (!cancelled) {
          setDetectedCity(resolved.city ?? null)
        }
      })
      .catch(() => {
        if (!cancelled) {
          setDetectedCity(null)
        }
      })

    return () => {
      cancelled = true
    }
  }, [location, token])

  const nearbyWards = useMemo(() => {
    if (!location || !wardsData?.wards) return []
    return wardsData.wards.filter(
      (ward) =>
        ward.centroidLat != null &&
        ward.centroidLng != null &&
        isWithinRadiusKm(
          location.latitude,
          location.longitude,
          ward.centroidLat,
          ward.centroidLng,
          EXPLORE_RADIUS_KM,
        ),
    )
  }, [location, wardsData?.wards])

  const exploreParams = useMemo(() => {
    if (!location) return null
    return {
      latitude: location.latitude,
      longitude: location.longitude,
      radiusKm: EXPLORE_RADIUS_KM,
      wardId: appliedFilters.wardId === '' ? undefined : appliedFilters.wardId,
      dateFrom: appliedFilters.dateFrom || undefined,
      dateTo: appliedFilters.dateTo || undefined,
      q: appliedFilters.q || undefined,
      limit: 120,
    }
  }, [appliedFilters, location])

  const { data, isLoading, isError, error, refetch, isFetching } = useExploreComplaints(
    exploreParams,
    Boolean(location),
  )

  const complaints = data?.complaints ?? []

  const handleSearch = (event: React.FormEvent) => {
    event.preventDefault()
    setAppliedFilters({ ...draftFilters })
  }

  const handleReset = () => {
    const cleared = defaultFilters()
    setDraftFilters(cleared)
    setAppliedFilters(cleared)
  }

  const openDetail = (id: string) => {
    if (!location) return
    setExploreLocation(location)
    setComplaintDetailSource('ward-updates')
    setViewingComplaintId(id)
    setCitizenView('complaint-detail')
  }

  const retryLocation = async () => {
    setLocating(true)
    setLocationError(null)
    const result = await resolveUserPosition()
    if (result.ok) {
      setLocation(result.position)
    } else {
      setLocationError(t('wardUpdates.locationError'))
    }
    setLocating(false)
  }

  return (
    <section className="space-y-4">
      <div className="overflow-hidden rounded-3xl border border-line/80 bg-white shadow-md">
        <div className="border-b border-line/80 bg-gradient-to-r from-amber-50/60 to-white px-5 py-4 sm:px-6">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-accent">
            {t('wardUpdates.eyebrow')}
          </p>
          <h1 className="mt-1 text-2xl font-extrabold">{t('wardUpdates.title')}</h1>
          <p className="mt-2 text-sm text-muted">{t('wardUpdates.subtitle', { radius: EXPLORE_RADIUS_KM })}</p>
          {location && detectedCityLabel && (
            <p className="mt-2 text-xs font-semibold text-teal-800">
              {t('wardUpdates.locationReady', {
                count: nearbyWards.length,
                radius: EXPLORE_RADIUS_KM,
                city: detectedCityLabel,
              })}
            </p>
          )}
          {location && !detectedCityLabel && !locating && (
            <p className="mt-2 text-xs font-semibold text-teal-800">
              {t('wardUpdates.locationReadyFallback', { radius: EXPLORE_RADIUS_KM })}
            </p>
          )}
        </div>

        <form className="space-y-3 border-b border-line/60 p-4 sm:p-5" onSubmit={handleSearch}>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <label className="block sm:col-span-2 xl:col-span-1">
              <span className="text-xs font-bold text-muted">{t('wardUpdates.filters.search')}</span>
              <input
                className="mt-1 h-10 w-full rounded-xl border border-line px-3 text-sm font-semibold"
                onChange={(e) => setDraftFilters((f) => ({ ...f, q: e.target.value }))}
                placeholder={t('wardUpdates.filters.searchPlaceholder')}
                value={draftFilters.q}
              />
            </label>
            <label className="block">
              <span className="text-xs font-bold text-muted">{t('wardUpdates.filters.ward')}</span>
              <select
                className="mt-1 h-10 w-full rounded-xl border border-line px-3 text-sm font-semibold"
                disabled={!location || nearbyWards.length === 0}
                onChange={(e) =>
                  setDraftFilters((f) => ({
                    ...f,
                    wardId: e.target.value ? Number(e.target.value) : '',
                  }))
                }
                value={draftFilters.wardId === '' ? '' : String(draftFilters.wardId)}
              >
                <option value="">{t('wardUpdates.filters.allNearbyWards')}</option>
                {nearbyWards.map((ward) => (
                  <option key={ward.id} value={ward.id}>
                    {ward.name} ({ward.code})
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="text-xs font-bold text-muted">{t('wardUpdates.filters.dateFrom')}</span>
              <input
                className="mt-1 h-10 w-full rounded-xl border border-line px-3 text-sm font-semibold"
                max={draftFilters.dateTo || toDateInputValue(new Date())}
                onChange={(e) => setDraftFilters((f) => ({ ...f, dateFrom: e.target.value }))}
                type="date"
                value={draftFilters.dateFrom}
              />
            </label>
            <label className="block">
              <span className="text-xs font-bold text-muted">{t('wardUpdates.filters.dateTo')}</span>
              <input
                className="mt-1 h-10 w-full rounded-xl border border-line px-3 text-sm font-semibold"
                min={draftFilters.dateFrom || undefined}
                max={toDateInputValue(new Date())}
                onChange={(e) => setDraftFilters((f) => ({ ...f, dateTo: e.target.value }))}
                type="date"
                value={draftFilters.dateTo}
              />
            </label>
          </div>
          <div className="flex flex-wrap items-center justify-end gap-2">
            <button
              className="h-10 whitespace-nowrap rounded-full border border-line px-5 text-sm font-bold text-muted transition hover:bg-slate-50"
              onClick={handleReset}
              type="button"
            >
              {t('wardUpdates.filters.reset')}
            </button>
            <button
              className="h-10 min-w-[6.5rem] whitespace-nowrap rounded-full bg-gradient-to-r from-teal-600 to-emerald-600 px-5 text-sm font-extrabold text-white shadow-md disabled:opacity-60"
              disabled={!location || locating}
              type="submit"
            >
              {t('wardUpdates.filters.searchButton')}
            </button>
          </div>
        </form>
      </div>

      {locating && (
        <div className="flex min-h-[12rem] flex-col items-center justify-center rounded-3xl border border-dashed border-slate-300 bg-white p-8 text-center">
          <div className="size-10 animate-spin rounded-full border-4 border-teal-200 border-t-teal-600" />
          <p className="mt-4 text-sm font-semibold text-muted">{t('wardUpdates.locating')}</p>
        </div>
      )}

      {!locating && locationError && (
        <div className="rounded-3xl border border-amber-200 bg-amber-50 p-6 text-center">
          <p className="font-extrabold text-amber-900">{locationError}</p>
          <button
            className="mt-4 rounded-full bg-amber-700 px-5 py-2 text-sm font-extrabold text-white"
            onClick={() => void retryLocation()}
            type="button"
          >
            {t('wardUpdates.retryLocation')}
          </button>
        </div>
      )}

      {!locating && location && (
        <>
          <div className="flex flex-wrap items-center justify-between gap-2 px-1">
            <p className="text-sm font-semibold text-muted">
              {isFetching
                ? t('wardUpdates.searching')
                : t('wardUpdates.results', { count: complaints.length })}
            </p>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-[0.65rem] font-bold uppercase tracking-wide text-slate-600">
              {t('wardUpdates.readOnly')}
            </span>
          </div>
          {detectedCityLabel && (
            <p className="px-1 text-xs text-muted">
              {t('wardUpdates.scopeHint', { city: detectedCityLabel, radius: EXPLORE_RADIUS_KM })}
            </p>
          )}

          {isLoading ? (
            <div className="flex min-h-[12rem] items-center justify-center rounded-3xl border border-dashed border-slate-300 bg-white">
              <div className="size-10 animate-spin rounded-full border-4 border-teal-200 border-t-teal-600" />
            </div>
          ) : isError ? (
            <div className="rounded-3xl border border-red-200 bg-red-50 p-6 text-center">
              <p className="font-extrabold text-red-800">{t('wardUpdates.loadError')}</p>
              <p className="mt-2 text-sm text-red-700">
                {error instanceof ApiError ? error.message : t('detail.loadError')}
              </p>
              <button
                className="mt-4 rounded-full bg-teal-600 px-5 py-2 text-sm font-extrabold text-white"
                onClick={() => void refetch()}
                type="button"
              >
                {t('wardUpdates.retry')}
              </button>
            </div>
          ) : complaints.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-10 text-center">
              <p className="text-lg font-extrabold">{t('wardUpdates.emptyTitle')}</p>
              <p className="mt-2 text-sm text-muted">{t('wardUpdates.emptyBody')}</p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {complaints.map((complaint) => (
                <ComplaintGridCard
                  complaint={complaint}
                  key={complaint.id}
                  onOpen={openDetail}
                  readOnlyLabel={t('wardUpdates.readOnly')}
                />
              ))}
            </div>
          )}
        </>
      )}
    </section>
  )
}
