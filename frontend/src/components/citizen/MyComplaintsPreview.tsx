import type { Complaint, CitizenComplaintStatus } from '../../types/complaint'
import { citizenStatusLabels, complaintCategoryLabels } from '../../types/complaint'
import {
  formatComplaintWardLabel,
  getComplaintDisplayTitle,
  parseComplaintSummary,
} from '../../lib/raiseComplaintFormat'
import { getRoleTheme } from '../../theme/roleThemes'

const theme = getRoleTheme('citizen')

type Props = {
  complaints: Complaint[]
  isLoading?: boolean
  onViewAll: () => void
  onReportIssue: () => void
}

const statusOrder: CitizenComplaintStatus[] = ['submitted', 'under_review', 'in_progress', 'resolved']

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

function StatusStepper({ status }: { status: CitizenComplaintStatus }) {
  const currentIndex = statusOrder.indexOf(status)

  return (
    <div className="mt-3 flex items-center gap-1">
      {statusOrder.map((step, index) => {
        const isComplete = index <= currentIndex
        const isCurrent = index === currentIndex
        return (
          <div className="flex flex-1 items-center gap-1" key={step}>
            <div
              className={`size-2 shrink-0 rounded-full ${
                isComplete ? (isCurrent ? 'bg-teal-500 ring-2 ring-teal-200' : 'bg-teal-400') : 'bg-slate-200'
              }`}
            />
            {index < statusOrder.length - 1 && (
              <div className={`h-0.5 flex-1 rounded ${index < currentIndex ? 'bg-teal-400' : 'bg-slate-200'}`} />
            )}
          </div>
        )
      })}
    </div>
  )
}

export function MyComplaintsPreview({ complaints, isLoading, onViewAll, onReportIssue }: Props) {
  if (isLoading) {
    return (
      <section className="overflow-hidden rounded-3xl border border-line/80 bg-white shadow-md shadow-slate-200/50">
        <div className={`border-b border-line/80 bg-gradient-to-r ${theme.sectionHeaderBg} px-5 py-4 sm:px-6`}>
          <p className={`text-xs font-bold uppercase tracking-[0.18em] ${theme.sectionEyebrow}`}>Your complaints</p>
          <h2 className="mt-1 text-xl font-extrabold text-ink">Recent activity</h2>
        </div>
        <div className="flex min-h-[12rem] items-center justify-center p-8">
          <div className="size-8 animate-spin rounded-full border-4 border-teal-200 border-t-teal-600" />
        </div>
      </section>
    )
  }

  if (complaints.length === 0) {
    return (
      <section className="overflow-hidden rounded-3xl border border-line/80 bg-white shadow-md shadow-slate-200/50">
        <div className={`border-b border-line/80 bg-gradient-to-r ${theme.sectionHeaderBg} px-5 py-4 sm:px-6`}>
          <p className={`text-xs font-bold uppercase tracking-[0.18em] ${theme.sectionEyebrow}`}>Your complaints</p>
          <h2 className="mt-1 text-xl font-extrabold text-ink">Recent activity</h2>
        </div>
        <div className="flex flex-col items-center p-8 text-center">
          <div className={`grid size-16 place-items-center rounded-2xl bg-gradient-to-br ${theme.emptyIconBg} text-2xl ${theme.emptyIconText}`}>
            ○
          </div>
          <p className="mt-4 font-extrabold text-ink">No complaints yet</p>
          <p className="mt-2 max-w-sm text-sm text-muted">
            Report an issue in your ward to get started. You will receive a permanent reference number.
          </p>
          <button
            className={`mt-5 rounded-full bg-gradient-to-r ${theme.primaryBtn} px-6 py-3 text-sm font-extrabold text-white shadow-lg`}
            onClick={onReportIssue}
            type="button"
          >
            Report your first issue
          </button>
        </div>
      </section>
    )
  }

  return (
    <section className="overflow-hidden rounded-3xl border border-line/80 bg-white shadow-md shadow-slate-200/50">
      <div className={`border-b border-line/80 bg-gradient-to-r ${theme.sectionHeaderBg} px-5 py-4 sm:px-6`}>
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className={`text-xs font-bold uppercase tracking-[0.18em] ${theme.sectionEyebrow}`}>Your complaints</p>
            <h2 className="mt-1 text-xl font-extrabold text-ink">Recent activity</h2>
          </div>
          <button
            className={`rounded-full px-3 py-1 text-xs font-bold transition ${theme.badgeSoft} ${theme.badgeSoftHover}`}
            onClick={onViewAll}
            type="button"
          >
            View all
          </button>
        </div>
      </div>

      <ul className="divide-y divide-line/60 p-3 sm:p-4">
        {complaints.map((complaint, index) => (
          <li className="rounded-2xl p-3 transition hover:bg-slate-50/80 sm:p-4" key={complaint.id}>
            <div className="flex items-start gap-4">
              <div className={`grid size-10 shrink-0 place-items-center rounded-2xl bg-gradient-to-br ${theme.cardIndexBg} text-sm font-extrabold text-white shadow-md`}>
                {index + 1}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`font-mono text-xs font-bold ${theme.referenceText}`}>{complaint.publicReference}</span>
                  <span className={`rounded-full px-2.5 py-0.5 text-[0.65rem] font-bold uppercase tracking-wide ${statusColors[complaint.status]}`}>
                    {citizenStatusLabels[complaint.status]}
                  </span>
                </div>
                <p className="mt-2 font-bold leading-snug text-ink">
                  {getComplaintDisplayTitle(complaint, complaintCategoryLabels[complaint.category])}
                </p>
                <p className="mt-1 text-xs font-semibold text-muted">
                  {formatComplaintWardLabel(complaint)} · {formatDate(complaint.submittedAt)}
                </p>
                <p className="mt-2 line-clamp-2 text-sm text-muted">
                  {parseComplaintSummary(complaint.description)}
                </p>
                <StatusStepper status={complaint.status} />
                {complaint.clusterCount > 1 && (
                  <p className={`mt-3 rounded-xl px-3 py-2 text-xs font-semibold ${theme.highlightBg} ${theme.highlightText}`}>
                    {complaint.clusterCount} residents reported similar issues in your ward
                  </p>
                )}
              </div>
            </div>
          </li>
        ))}
      </ul>
    </section>
  )
}
