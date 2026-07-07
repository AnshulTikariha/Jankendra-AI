export type ScoreTier = 'critical' | 'high' | 'moderate' | 'low'

type TierStyle = {
  label: string
  card: string
  header: string
  badge: string
  scoreText: string
  chip: string
  dot: string
}

export const tierStyles: Record<ScoreTier, TierStyle> = {
  critical: {
    label: 'Critical',
    card: 'border-rose-200 bg-rose-50/40',
    header: 'border-rose-100 bg-rose-100/60',
    badge: 'bg-rose-600 text-white',
    scoreText: 'text-rose-700',
    chip: 'bg-rose-50 text-rose-900',
    dot: 'bg-rose-500',
  },
  high: {
    label: 'High',
    card: 'border-amber-200 bg-amber-50/40',
    header: 'border-amber-100 bg-amber-100/60',
    badge: 'bg-amber-500 text-white',
    scoreText: 'text-amber-700',
    chip: 'bg-amber-50 text-amber-900',
    dot: 'bg-amber-500',
  },
  moderate: {
    label: 'Moderate',
    card: 'border-sky-200 bg-sky-50/40',
    header: 'border-sky-100 bg-sky-100/60',
    badge: 'bg-sky-600 text-white',
    scoreText: 'text-sky-700',
    chip: 'bg-sky-50 text-sky-900',
    dot: 'bg-sky-500',
  },
  low: {
    label: 'Low',
    card: 'border-emerald-200 bg-emerald-50/40',
    header: 'border-emerald-100 bg-emerald-100/60',
    badge: 'bg-emerald-600 text-white',
    scoreText: 'text-emerald-700',
    chip: 'bg-emerald-50 text-emerald-900',
    dot: 'bg-emerald-500',
  },
}

export const tierOrder: ScoreTier[] = ['critical', 'high', 'moderate', 'low']

export function getScoreTier(score: number, maxScore: number): ScoreTier {
  const pct = maxScore > 0 ? (score / maxScore) * 100 : 0
  if (pct >= 75) return 'critical'
  if (pct >= 50) return 'high'
  if (pct >= 25) return 'moderate'
  return 'low'
}

type FilterBarProps = {
  search: string
  onSearch: (value: string) => void
  tierFilter: 'all' | ScoreTier
  onTierFilter: (value: 'all' | ScoreTier) => void
  placeholder?: string
}

export function PriorityFilterBar({ search, onSearch, tierFilter, onTierFilter, placeholder }: FilterBarProps) {
  return (
    <div className="grid gap-3 rounded-2xl border border-line/70 bg-white px-4 py-3 shadow-sm sm:grid-cols-[1fr_auto]">
      <div className="relative">
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted">
          <svg aria-hidden="true" className="size-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <circle cx="11" cy="11" r="7" />
            <path d="M21 21l-4-4" strokeLinecap="round" />
          </svg>
        </span>
        <input
          className="h-10 w-full rounded-xl border border-line/80 bg-white pl-9 pr-3 text-sm font-medium text-ink outline-none transition focus:border-violet-400 focus:ring-2 focus:ring-violet-100"
          onChange={(e) => onSearch(e.target.value)}
          placeholder={placeholder ?? 'Search…'}
          type="search"
          value={search}
        />
      </div>
      <select
        aria-label="Filter by rank tier"
        className="h-10 rounded-xl border border-line/80 bg-white px-3 text-sm font-semibold text-ink outline-none transition focus:border-violet-400 focus:ring-2 focus:ring-violet-100"
        onChange={(e) => onTierFilter(e.target.value as 'all' | ScoreTier)}
        value={tierFilter}
      >
        <option value="all">All ranks</option>
        {tierOrder.map((tier) => (
          <option key={tier} value={tier}>
            {tierStyles[tier].label} priority
          </option>
        ))}
      </select>
    </div>
  )
}

type LegendProps = {
  rangeStart: number
  rangeEnd: number
  total: number
  noun: string
  tierFilter: 'all' | ScoreTier
  onTierFilter: (value: 'all' | ScoreTier) => void
}

export function PriorityLegend({ rangeStart, rangeEnd, total, noun, tierFilter, onTierFilter }: LegendProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-line/70 bg-white px-4 py-3 shadow-sm">
      <p className="text-xs font-semibold text-muted">
        Showing <span className="font-extrabold text-ink">{rangeStart}–{rangeEnd}</span> of{' '}
        <span className="font-extrabold text-ink">{total}</span> {noun}
      </p>
      <div className="flex flex-wrap items-center gap-3">
        {tierOrder.map((tier) => (
          <button
            className={`flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[0.7rem] font-bold transition ${
              tierFilter === tier ? 'bg-slate-100 text-ink' : 'text-muted hover:bg-slate-50'
            }`}
            key={tier}
            onClick={() => onTierFilter(tierFilter === tier ? 'all' : tier)}
            type="button"
          >
            <span className={`size-2.5 rounded-full ${tierStyles[tier].dot}`} />
            {tierStyles[tier].label}
          </button>
        ))}
      </div>
    </div>
  )
}

type PaginationProps = {
  currentPage: number
  pageCount: number
  onPage: (page: number) => void
}

export function GridPagination({ currentPage, pageCount, onPage }: PaginationProps) {
  if (pageCount <= 1) return null
  return (
    <nav aria-label="Pagination" className="flex items-center justify-center gap-1.5">
      <button
        className="rounded-lg border border-line/80 bg-white px-3 py-1.5 text-xs font-bold text-ink transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
        disabled={currentPage === 1}
        onClick={() => onPage(Math.max(1, currentPage - 1))}
        type="button"
      >
        Prev
      </button>
      {Array.from({ length: pageCount }, (_, i) => i + 1).map((pageNum) => (
        <button
          aria-current={pageNum === currentPage ? 'page' : undefined}
          className={`min-w-[2.25rem] rounded-lg border px-3 py-1.5 text-xs font-bold transition ${
            pageNum === currentPage
              ? 'border-violet-600 bg-violet-600 text-white shadow-sm'
              : 'border-line/80 bg-white text-ink hover:bg-slate-50'
          }`}
          key={pageNum}
          onClick={() => onPage(pageNum)}
          type="button"
        >
          {pageNum}
        </button>
      ))}
      <button
        className="rounded-lg border border-line/80 bg-white px-3 py-1.5 text-xs font-bold text-ink transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
        disabled={currentPage === pageCount}
        onClick={() => onPage(Math.min(pageCount, currentPage + 1))}
        type="button"
      >
        Next
      </button>
    </nav>
  )
}
