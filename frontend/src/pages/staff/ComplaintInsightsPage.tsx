import { useMemo, useState } from 'react'
import { ApiError } from '../../api/errors'
import { PageHeader } from '../../components/staff/PageStates'
import { useComplaintThemes } from '../../hooks/useLeaderAi'
import {
  severityBadgeStyles,
  severityCardStyles,
  severityLabels,
  type ComplaintSeverity,
} from '../../lib/complaintSeverity'

const PERIOD_OPTIONS = [
  { days: 7, label: '7 days' },
  { days: 14, label: '14 days' },
  { days: 30, label: '30 days' },
]

const SEVERITY_ORDER: ComplaintSeverity[] = ['critical', 'high', 'medium', 'low']

const severityBar: Record<ComplaintSeverity, string> = {
  critical: 'bg-rose-500',
  high: 'bg-orange-400',
  medium: 'bg-amber-400',
  low: 'bg-emerald-400',
}

function normalizeSeverity(value: string): ComplaintSeverity {
  const key = value.trim().toLowerCase()
  if (key === 'low' || key === 'medium' || key === 'high' || key === 'critical') return key
  return 'medium'
}

export function ComplaintInsightsPage() {
  const [days, setDays] = useState(14)
  const { data, isLoading, isError, error, refetch, isFetching } = useComplaintThemes(days)

  const themes = useMemo(
    () =>
      [...(data?.themes ?? [])].sort(
        (a, b) =>
          SEVERITY_ORDER.indexOf(normalizeSeverity(a.severity)) -
          SEVERITY_ORDER.indexOf(normalizeSeverity(b.severity)),
      ),
    [data?.themes],
  )

  const severityTotals = useMemo(() => {
    const totals: Record<ComplaintSeverity, number> = { critical: 0, high: 0, medium: 0, low: 0 }
    for (const theme of themes) totals[normalizeSeverity(theme.severity)] += theme.count
    return totals
  }, [themes])

  const categoryTotals = useMemo(() => {
    const totals = new Map<string, number>()
    for (const theme of themes) {
      const key = theme.category || 'other'
      totals.set(key, (totals.get(key) ?? 0) + theme.count)
    }
    return [...totals.entries()].sort((a, b) => b[1] - a[1])
  }, [themes])

  const totalThemeReports = useMemo(
    () => themes.reduce((sum, theme) => sum + theme.count, 0),
    [themes],
  )

  return (
    <section className="space-y-6">
      <PageHeader
        description="AI-clustered analysis of recent complaints — the dominant themes, where they concentrate, and how severe they are."
        eyebrow="Emerging themes"
        title="Complaint insights"
      />

      {/* Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-line/70 bg-white px-4 py-3 shadow-sm">
        <div className="flex items-center gap-1.5">
          <span className="mr-1 text-xs font-bold uppercase tracking-wide text-muted">Period</span>
          {PERIOD_OPTIONS.map((option) => (
            <button
              className={`rounded-full px-3 py-1.5 text-xs font-bold transition ${
                days === option.days
                  ? 'bg-primary text-white shadow-sm'
                  : 'border border-line bg-white text-muted hover:bg-slate-50'
              }`}
              key={option.days}
              onClick={() => setDays(option.days)}
              type="button"
            >
              {option.label}
            </button>
          ))}
        </div>
        <button
          className="inline-flex items-center gap-2 rounded-full border border-line bg-white px-4 py-1.5 text-xs font-bold text-primary transition hover:border-primary-light disabled:opacity-50"
          disabled={isFetching}
          onClick={() => void refetch()}
          type="button"
        >
          <svg aria-hidden="true" className={`size-3.5 ${isFetching ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path d="M4 4v6h6M20 20v-6h-6" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M20 10a8 8 0 0 0-14.5-3.5M4 14a8 8 0 0 0 14.5 3.5" strokeLinecap="round" />
          </svg>
          Regenerate
        </button>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          <div className="h-24 animate-pulse rounded-3xl bg-slate-100" />
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="h-40 animate-pulse rounded-2xl bg-slate-100" />
            <div className="h-40 animate-pulse rounded-2xl bg-slate-100" />
          </div>
        </div>
      ) : isError ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-3xl border border-dashed border-slate-300/80 bg-white/80 p-10 text-center shadow-sm">
          <p className="text-sm font-semibold text-muted">
            {error instanceof ApiError && error.status === 503
              ? 'AI complaint analysis is not configured on the server yet.'
              : 'Could not analyse complaints right now. The AI service may be starting up.'}
          </p>
          <button
            className="rounded-full bg-primary px-5 py-2 text-sm font-extrabold text-white shadow-md transition hover:bg-primary-dark"
            onClick={() => void refetch()}
            type="button"
          >
            Try again
          </button>
        </div>
      ) : data && themes.length > 0 ? (
        <>
          {/* AI overview */}
          {data.overview && (
            <section className="overflow-hidden rounded-3xl border border-fuchsia-200/70 bg-white shadow-md shadow-fuchsia-100/40">
              <div className="flex items-center gap-2 bg-gradient-to-r from-fuchsia-600 to-pink-600 px-5 py-3 text-white sm:px-6">
                <svg aria-hidden="true" className="size-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M12 3l1.9 4.8L18.7 9l-4.8 1.9L12 15.7 10.1 10.9 5.3 9l4.8-1.2z" strokeLinejoin="round" />
                </svg>
                <p className="text-xs font-bold uppercase tracking-[0.16em]">AI overview</p>
              </div>
              <p className="p-5 text-sm leading-6 text-ink sm:px-6">{data.overview}</p>
            </section>
          )}

          {/* Stat + breakdown row */}
          <div className="grid gap-4 lg:grid-cols-3">
            <article className="rounded-2xl border border-line/80 bg-white p-5 shadow-sm">
              <p className="text-xs font-bold uppercase tracking-wide text-muted">Complaints analysed</p>
              <p className="mt-2 text-3xl font-extrabold text-ink">{data.total_complaints}</p>
              <p className="mt-1 text-xs font-semibold text-muted">
                {themes.length} themes · {data.period_label}
              </p>
            </article>

            <article className="rounded-2xl border border-line/80 bg-white p-5 shadow-sm lg:col-span-2">
              <p className="text-xs font-bold uppercase tracking-wide text-muted">Severity mix</p>
              <div className="mt-3 space-y-2">
                {SEVERITY_ORDER.map((severity) => {
                  const value = severityTotals[severity]
                  const pct = totalThemeReports > 0 ? Math.round((value / totalThemeReports) * 100) : 0
                  return (
                    <div className="flex items-center gap-3" key={severity}>
                      <span className="w-16 shrink-0 text-xs font-bold text-muted">{severityLabels[severity]}</span>
                      <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-slate-100">
                        <div className={`h-full rounded-full ${severityBar[severity]}`} style={{ width: `${pct}%` }} />
                      </div>
                      <span className="w-8 shrink-0 text-right text-xs font-extrabold tabular-nums text-ink">{value}</span>
                    </div>
                  )
                })}
              </div>
            </article>
          </div>

          {/* Category breakdown */}
          {categoryTotals.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {categoryTotals.map(([category, count]) => (
                <span className="rounded-full border border-line/70 bg-white px-3 py-1 text-xs font-bold text-ink shadow-sm" key={category}>
                  {category} · {count}
                </span>
              ))}
            </div>
          )}

          {/* Detailed themes */}
          <div className="space-y-4">
            {themes.map((theme) => {
              const severity = normalizeSeverity(theme.severity)
              return (
                <article
                  className={`rounded-2xl border bg-white p-5 shadow-sm ${severityCardStyles[severity]}`}
                  key={`${theme.theme}-${theme.category}`}
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h2 className="text-lg font-extrabold leading-snug text-ink">{theme.theme}</h2>
                      <p className="mt-0.5 text-xs font-semibold uppercase tracking-wide text-muted">{theme.category}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`rounded-full px-2.5 py-0.5 text-[0.65rem] font-bold uppercase tracking-wide ${severityBadgeStyles[severity]}`}>
                        {severityLabels[severity]}
                      </span>
                      <span className="rounded-full bg-slate-900 px-2.5 py-1 text-xs font-extrabold text-white">
                        {theme.count} reports
                      </span>
                    </div>
                  </div>
                  <p className="mt-3 text-sm leading-6 text-ink">{theme.summary}</p>
                  {theme.wards.length > 0 && (
                    <div className="mt-3">
                      <p className="text-[0.65rem] font-bold uppercase tracking-wide text-muted">Most affected wards</p>
                      <div className="mt-1.5 flex flex-wrap gap-1.5">
                        {theme.wards.map((ward) => (
                          <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-700" key={ward}>
                            {ward}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </article>
              )
            })}
          </div>
        </>
      ) : (
        <div className="rounded-3xl border border-dashed border-slate-300/80 bg-white/80 p-10 text-center shadow-sm">
          <p className="text-sm font-semibold text-muted">
            No complaints in the selected period to analyse.
          </p>
        </div>
      )}
    </section>
  )
}
