import { useMemo, useState } from 'react'
import { getRoleTheme } from '../../theme/roleThemes'

export type WardListMetric = {
  key: string
  label: string
  value: number
  alert?: boolean
}

export type WardListItem = {
  id: string
  name: string
  subtitle?: string
  intensity?: number
  metrics: WardListMetric[]
  badges?: string[]
}

type Props = {
  title: string
  eyebrow?: string
  items: WardListItem[]
  intensityLabel?: string
}

const DEFAULT_SORT = 'recommended'
const METRIC_COL = 'w-12 shrink-0 text-right sm:w-16'

export function WardList({ title, eyebrow = 'Constituency wards', items }: Props) {
  const theme = getRoleTheme('leader')
  const [query, setQuery] = useState('')
  const [sortKey, setSortKey] = useState(DEFAULT_SORT)

  const columns = useMemo(
    () => (items[0]?.metrics ?? []).map((metric) => ({ key: metric.key, label: metric.label })),
    [items],
  )

  const visibleItems = useMemo(() => {
    const term = query.trim().toLowerCase()
    const filtered = term
      ? items.filter((item) => item.name.toLowerCase().includes(term))
      : items

    if (sortKey === DEFAULT_SORT) return filtered

    return [...filtered].sort((a, b) => {
      const aValue = a.metrics.find((metric) => metric.key === sortKey)?.value ?? 0
      const bValue = b.metrics.find((metric) => metric.key === sortKey)?.value ?? 0
      return bValue - aValue
    })
  }, [items, query, sortKey])

  return (
    <section className="flex flex-col self-start overflow-hidden rounded-3xl border border-line/80 bg-white shadow-md shadow-slate-200/50">
      <div className={`border-b border-line/80 bg-gradient-to-r ${theme.sectionHeaderBg} px-5 py-4 sm:px-6`}>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className={`text-xs font-bold uppercase tracking-[0.16em] ${theme.sectionEyebrow}`}>{eyebrow}</p>
            <h2 className="mt-1 text-xl font-extrabold">{title}</h2>
          </div>
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">
            {items.length} wards
          </span>
        </div>

        <div className="mt-4 flex flex-col gap-2 sm:flex-row">
          <label className="relative flex-1">
            <span className="sr-only">Search wards</span>
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
              <SearchIcon />
            </span>
            <input
              className="w-full rounded-xl border border-line bg-white py-2 pl-9 pr-3 text-sm font-semibold text-ink outline-none transition focus:border-violet-300 focus:ring-4 focus:ring-violet-200/40"
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search ward by name"
              type="search"
              value={query}
            />
          </label>
          {columns.length > 0 && (
            <label className="sm:w-52">
              <span className="sr-only">Sort wards</span>
              <select
                className="w-full rounded-xl border border-line bg-white px-3 py-2 text-sm font-semibold text-ink outline-none transition focus:border-violet-300 focus:ring-4 focus:ring-violet-200/40"
                onChange={(event) => setSortKey(event.target.value)}
                value={sortKey}
              >
                <option value={DEFAULT_SORT}>Sort: Recommended</option>
                {columns.map((column) => (
                  <option key={column.key} value={column.key}>
                    Sort: {column.label} (high to low)
                  </option>
                ))}
              </select>
            </label>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3 border-b border-line/80 bg-slate-50 px-4 py-2 text-[0.6rem] font-bold uppercase tracking-wide text-muted sm:px-5">
        <span className="w-8 shrink-0 text-center">#</span>
        <span className="min-w-0 flex-1">Ward</span>
        {columns.map((column) => (
          <span className={METRIC_COL} key={column.key}>
            {column.label}
          </span>
        ))}
      </div>

      <div className="max-h-[32rem] divide-y divide-line/70 overflow-y-auto">
        {visibleItems.length === 0 ? (
          <p className="px-5 py-10 text-center text-sm font-semibold text-muted">No wards match your search.</p>
        ) : (
          visibleItems.map((item, index) => (
            <article className="flex items-center gap-3 px-4 py-2.5 transition hover:bg-slate-50 sm:px-5" key={item.id}>
              <div
                className={`grid size-8 shrink-0 place-items-center rounded-lg text-xs font-extrabold text-white shadow-sm ${
                  index === 0 && sortKey !== DEFAULT_SORT
                    ? `bg-gradient-to-br ${theme.sidebarRoleAvatar}`
                    : 'bg-gradient-to-br from-slate-500 to-slate-700'
                }`}
              >
                {index + 1}
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="truncate font-bold text-ink">{item.name}</p>
                  {item.badges?.map((badge) => (
                    <span
                      className={`shrink-0 rounded-full px-2 py-0.5 text-[0.6rem] font-bold ${theme.badgeSoft}`}
                      key={badge}
                    >
                      {badge}
                    </span>
                  ))}
                </div>
                {item.subtitle && <p className="truncate text-xs text-muted">{item.subtitle}</p>}
                {typeof item.intensity === 'number' && (
                  <div className="mt-1.5 h-1.5 w-full max-w-[9rem] overflow-hidden rounded-full bg-slate-200">
                    <div
                      className={`h-full rounded-full bg-gradient-to-r ${theme.primaryBtn}`}
                      style={{ width: `${Math.max(4, Math.min(100, item.intensity))}%` }}
                    />
                  </div>
                )}
              </div>

              {item.metrics.map((metric) => (
                <span
                  className={`${METRIC_COL} text-sm font-extrabold tabular-nums ${
                    metric.alert && metric.value > 0 ? 'text-rose-600' : 'text-ink'
                  }`}
                  key={metric.key}
                >
                  {metric.value}
                </span>
              ))}
            </article>
          ))
        )}
      </div>

      {query.trim() && (
        <div className="border-t border-line/70 bg-slate-50/60 px-5 py-2 text-xs font-semibold text-muted">
          Showing {visibleItems.length} of {items.length} wards
        </div>
      )}
    </section>
  )
}

function SearchIcon() {
  return (
    <svg aria-hidden="true" className="size-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <circle cx="11" cy="11" r="7" />
      <path d="M21 21l-4.3-4.3" strokeLinecap="round" />
    </svg>
  )
}
