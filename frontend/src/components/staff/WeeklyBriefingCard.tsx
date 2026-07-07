import { ApiError } from '../../api/errors'
import { useWeeklyBriefing } from '../../hooks/useLeaderAi'

function AiBadge() {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-white/20 px-2.5 py-0.5 text-[0.65rem] font-bold uppercase tracking-wide text-white">
      <svg aria-hidden="true" className="size-3" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path d="M12 3l1.9 4.8L18.7 9l-4.8 1.9L12 15.7 10.1 10.9 5.3 9l4.8-1.2z" strokeLinejoin="round" />
      </svg>
      AI briefing
    </span>
  )
}

function Section({ title, items, tone }: { title: string; items: string[]; tone: 'good' | 'risk' | 'action' }) {
  if (items.length === 0) return null
  const dot =
    tone === 'good' ? 'bg-emerald-500' : tone === 'risk' ? 'bg-rose-500' : 'bg-violet-500'
  return (
    <div>
      <p className="text-[0.7rem] font-bold uppercase tracking-[0.14em] text-muted">{title}</p>
      <ul className="mt-2 space-y-1.5">
        {items.map((item) => (
          <li className="flex gap-2 text-sm leading-snug text-ink" key={item}>
            <span className={`mt-1.5 size-1.5 shrink-0 rounded-full ${dot}`} />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

export function WeeklyBriefingCard() {
  const { data, isLoading, isError, error, refetch, isFetching } = useWeeklyBriefing()

  return (
    <section className="overflow-hidden rounded-3xl border border-violet-200/70 bg-white shadow-md shadow-violet-100/50">
      <div className="flex items-center justify-between gap-3 bg-gradient-to-r from-violet-600 to-indigo-600 px-5 py-4 text-white sm:px-6">
        <div className="min-w-0">
          <AiBadge />
          <h2 className="mt-1.5 truncate text-lg font-extrabold">
            {isLoading ? 'Generating your briefing…' : data?.headline || 'Weekly briefing'}
          </h2>
        </div>
        <button
          aria-label="Regenerate briefing"
          className="shrink-0 rounded-full bg-white/15 p-2 text-white transition hover:bg-white/25 disabled:opacity-50"
          disabled={isFetching}
          onClick={() => void refetch()}
          type="button"
        >
          <svg aria-hidden="true" className={`size-4 ${isFetching ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path d="M4 4v6h6M20 20v-6h-6" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M20 10a8 8 0 0 0-14.5-3.5M4 14a8 8 0 0 0 14.5 3.5" strokeLinecap="round" />
          </svg>
        </button>
      </div>

      <div className="p-5 sm:p-6">
        {isLoading ? (
          <div className="space-y-3">
            <div className="h-4 w-3/4 animate-pulse rounded bg-slate-100" />
            <div className="h-4 w-full animate-pulse rounded bg-slate-100" />
            <div className="h-4 w-5/6 animate-pulse rounded bg-slate-100" />
          </div>
        ) : isError ? (
          <div className="flex flex-col items-start gap-2">
            <p className="text-sm font-semibold text-muted">
              {error instanceof ApiError && error.status === 503
                ? 'AI briefing is not configured on the server yet.'
                : 'Could not generate the briefing right now.'}
            </p>
            <button
              className="rounded-full border border-line bg-white px-4 py-1.5 text-xs font-bold text-primary transition hover:border-primary-light"
              onClick={() => void refetch()}
              type="button"
            >
              Try again
            </button>
          </div>
        ) : data ? (
          <div className="space-y-5">
            <p className="text-sm leading-6 text-ink">{data.summary}</p>
            <div className="grid gap-5 sm:grid-cols-3">
              <Section items={data.highlights} title="Highlights" tone="good" />
              <Section items={data.risks} title="Risks" tone="risk" />
              <Section items={data.recommendations} title="Recommended actions" tone="action" />
            </div>
          </div>
        ) : null}
      </div>
    </section>
  )
}
