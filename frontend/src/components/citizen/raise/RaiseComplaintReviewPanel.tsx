import { useTranslation } from 'react-i18next'
import {
  buildComplaintDescription,
  getCategoryDisplayLabel,
} from '../../../lib/raiseComplaintFormat'
import type {
  ComplaintDuration,
  ComplaintImpact,
  RaiseComplaintForm,
} from '../../../types/raiseComplaint'
import { SimilarComplaintsBanner } from './SimilarComplaintsBanner'

type Props = {
  form: RaiseComplaintForm
  wardName: string
  phone?: string
  metaLabels: {
    duration: Record<ComplaintDuration, string>
    impact: Record<ComplaintImpact, string>
  }
  similarCount: number
  clusterCount: number
  hasSimilar: boolean
  onEdit: (step: 'where' | 'what' | 'details') => void
}

export function RaiseComplaintReviewPanel({
  form,
  wardName,
  phone,
  metaLabels,
  similarCount,
  clusterCount,
  hasSimilar,
  onEdit,
}: Props) {
  const { t } = useTranslation('complaints')
  const categoryLabel = getCategoryDisplayLabel(
    form,
    t(`raise.categories.${form.category}`),
  )
  const formattedSubmission = buildComplaintDescription(form, metaLabels)

  const rows: Array<{
    section: 'where' | 'what' | 'details'
    label: string
    value: string
    optional?: boolean
  }> = [
    { section: 'where', label: t('raise.review.fields.ward'), value: wardName },
    {
      section: 'where',
      label: t('raise.review.fields.location'),
      value: form.locationDetail.trim() || t('raise.review.notProvided'),
      optional: !form.locationDetail.trim(),
    },
    {
      section: 'where',
      label: t('raise.review.fields.contact'),
      value: phone ? `+91 ${phone}` : t('raise.review.notProvided'),
    },
    { section: 'what', label: t('raise.review.fields.category'), value: categoryLabel },
    {
      section: 'details',
      label: t('raise.review.fields.title'),
      value: form.title.trim() || t('raise.review.notProvided'),
      optional: !form.title.trim(),
    },
    {
      section: 'details',
      label: t('raise.review.fields.description'),
      value: form.description.trim(),
    },
    {
      section: 'details',
      label: t('raise.review.fields.duration'),
      value: form.duration
        ? metaLabels.duration[form.duration]
        : t('raise.review.notProvided'),
      optional: !form.duration,
    },
    {
      section: 'details',
      label: t('raise.review.fields.impact'),
      value: form.impact
        ? metaLabels.impact[form.impact]
        : t('raise.review.notProvided'),
      optional: !form.impact,
    },
  ]

  const sections = [
    { id: 'where' as const, title: t('raise.steps.where') },
    { id: 'what' as const, title: t('raise.steps.what') },
    { id: 'details' as const, title: t('raise.steps.details') },
  ]

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-extrabold">{t('raise.review.title')}</h2>
        <p className="mt-1 text-sm text-muted">{t('raise.review.subtitle')}</p>
      </div>

      {sections.map((section) => {
        const sectionRows = rows.filter((row) => row.section === section.id)
        return (
          <div
            className="overflow-hidden rounded-2xl border border-line/80 bg-white shadow-sm"
            key={section.id}
          >
            <div className="flex items-center justify-between gap-2 border-b border-line/60 bg-slate-50/80 px-4 py-3">
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-muted">
                {section.title}
              </p>
              <button
                className="text-xs font-bold text-teal-700"
                onClick={() => onEdit(section.id)}
                type="button"
              >
                {t('raise.review.edit')}
              </button>
            </div>
            <dl className="divide-y divide-line/50">
              {sectionRows.map((row) => (
                <div className="grid gap-1 px-4 py-3 sm:grid-cols-[9rem_1fr]" key={row.label}>
                  <dt className="text-xs font-bold uppercase tracking-wide text-muted">
                    {row.label}
                  </dt>
                  <dd
                    className={`text-sm font-semibold leading-6 ${
                      row.optional ? 'text-muted' : 'text-ink'
                    } ${row.label === t('raise.review.fields.description') ? 'whitespace-pre-wrap' : ''}`}
                  >
                    {row.value}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        )
      })}

      {hasSimilar && (
        <SimilarComplaintsBanner
          category={form.category}
          clusterCount={clusterCount}
          count={similarCount}
        />
      )}

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">
        <div className="border-b border-slate-200 px-4 py-3">
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-muted">
            {t('raise.review.submissionPreview')}
          </p>
          <p className="mt-1 text-xs text-muted">{t('raise.review.submissionPreviewHint')}</p>
        </div>
        <pre className="max-h-48 overflow-auto whitespace-pre-wrap px-4 py-3 font-sans text-sm leading-6 text-ink">
          {formattedSubmission}
        </pre>
      </div>

      <p className="rounded-xl border border-teal-100 bg-teal-50 px-4 py-3 text-xs font-semibold text-teal-900">
        {t('raise.review.privacy')}
      </p>
    </div>
  )
}
