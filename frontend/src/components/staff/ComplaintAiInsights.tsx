import { useComplaintInsights } from '../../hooks/useComplaintInsights'
import { suggestDepartment } from '../../lib/departmentSuggestion'
import { parseComplaintSummary } from '../../lib/raiseComplaintFormat'
import type { StaffComplaint } from '../../hooks/useStaffComplaintsQueue'

const severityColors: Record<string, string> = {
  low: 'bg-slate-100 text-slate-700',
  medium: 'bg-amber-100 text-amber-800',
  high: 'bg-orange-100 text-orange-800',
  critical: 'bg-rose-100 text-rose-800',
}

const sentimentColors: Record<string, string> = {
  positive: 'bg-emerald-100 text-emerald-800',
  neutral: 'bg-slate-100 text-slate-700',
  negative: 'bg-amber-100 text-amber-800',
  frustrated: 'bg-orange-100 text-orange-800',
  urgent: 'bg-rose-100 text-rose-800',
}

type ComplaintAiInsightsProps = {
  complaint: StaffComplaint
  onApplyDepartment: (department: string) => void
}

export function ComplaintAiInsights({
  complaint,
  onApplyDepartment,
}: ComplaintAiInsightsProps) {
  const text = parseComplaintSummary(complaint.description)
  const { insights, isLoading, isError, unavailable } = useComplaintInsights(
    complaint.id,
    text,
  )

  if (text.trim().length < 20) {
    return null
  }

  if (unavailable) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs font-semibold text-muted">
        AI insights are not configured on the server.
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="rounded-2xl border border-line/80 bg-white px-4 py-3 text-xs font-semibold text-muted">
        Analysing complaint with AI…
      </div>
    )
  }

  if (isError || !insights) {
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs font-semibold text-amber-800">
        Could not load AI insights for this complaint.
      </div>
    )
  }

  const suggestedCategory = insights.categories[0] ?? complaint.category
  const { department, reason } = suggestDepartment(suggestedCategory)

  return (
    <div className="space-y-3 rounded-2xl border border-teal-200/70 bg-gradient-to-br from-teal-50/60 to-white px-4 py-4">
      <div className="flex items-center gap-2">
        <span className="grid size-6 place-items-center rounded-lg bg-gradient-to-br from-teal-500 to-emerald-600 text-xs font-extrabold text-white">
          AI
        </span>
        <p className="text-xs font-bold uppercase tracking-wide text-teal-800">
          AI insights
        </p>
      </div>

      <p className="text-sm font-medium text-ink">{insights.summary}</p>

      <div className="flex flex-wrap gap-2">
        <span
          className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${
            severityColors[insights.severity] ?? 'bg-slate-100 text-slate-700'
          }`}
        >
          Severity: {insights.severity}
        </span>
        <span
          className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${
            sentimentColors[insights.sentiment] ?? 'bg-slate-100 text-slate-700'
          }`}
        >
          {insights.sentiment}
        </span>
      </div>

      {insights.keywords.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {insights.keywords.map((keyword) => (
            <span
              className="rounded-full bg-white px-2 py-0.5 text-xs font-semibold text-muted ring-1 ring-line/70"
              key={keyword}
            >
              {keyword}
            </span>
          ))}
        </div>
      )}

      <div className="rounded-xl border border-line/70 bg-white px-3 py-2">
        <p className="text-xs font-bold text-ink">
          Suggested department: <span className="text-teal-700">{department}</span>
        </p>
        <p className="mt-0.5 text-xs text-muted">{reason}</p>
        <button
          className="mt-2 rounded-full border border-teal-300 bg-teal-50 px-3 py-1.5 text-xs font-extrabold text-teal-800 transition hover:bg-teal-100"
          onClick={() => onApplyDepartment(department)}
          type="button"
        >
          Apply department suggestion
        </button>
      </div>
    </div>
  )
}
