import { demoCitizenTransparency } from '../../data/demoCitizenDashboard'

type Props = {
  maxClusterCount: number
}

export function CommunityImpactCard({ maxClusterCount }: Props) {
  return (
    <section className="overflow-hidden rounded-3xl border border-line/80 bg-white shadow-md shadow-slate-200/50">
      <div className="border-b border-line/80 bg-gradient-to-r from-violet-50/50 to-white px-5 py-4">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-accent">Community impact</p>
        <h2 className="mt-1 text-lg font-extrabold">Your voice adds weight</h2>
      </div>
      <div className="space-y-4 p-5">
        <div className="rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 p-4 text-white shadow-lg">
          <p className="text-xs font-bold uppercase tracking-wide text-white/70">This week in your constituency</p>
          <p className="mt-2 text-3xl font-extrabold">{demoCitizenTransparency.citizenReportsWeek}</p>
          <p className="mt-1 text-sm text-white/80">citizen reports filed</p>
        </div>

        {maxClusterCount > 1 ? (
          <div className="rounded-2xl border border-teal-200 bg-teal-50 p-4">
            <p className="text-sm font-bold text-teal-900">
              Up to {maxClusterCount} residents have reported similar issues in your ward.
            </p>
            <p className="mt-2 text-xs text-teal-800">
              Clustered complaints are prioritised for faster review by your representative&apos;s office.
            </p>
          </div>
        ) : (
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-sm font-bold text-ink">How clustering works</p>
            <p className="mt-2 text-xs text-muted">
              When multiple residents report the same type of issue in a ward, they are grouped together so your representative can act on patterns, not isolated cases.
            </p>
          </div>
        )}

        <div className="flex items-center gap-3 rounded-2xl border border-line/80 p-3">
          <div className="grid size-10 place-items-center rounded-xl bg-emerald-100 text-emerald-700">
            <svg aria-hidden="true" className="size-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M5 12l5 5L20 7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <div>
            <p className="text-xs font-bold text-muted">Avg. resolution time</p>
            <p className="font-extrabold text-ink">{demoCitizenTransparency.avgResolutionDays} days</p>
          </div>
        </div>
      </div>
    </section>
  )
}
