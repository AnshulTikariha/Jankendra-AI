import { useTranslation } from 'react-i18next'
import {
  buildComplaintDescription,
  buildLocationDetail,
  formatCoordinates,
  getCategoriesDisplayLabel,
  getPrimaryCategory,
} from '../../../lib/raiseComplaintFormat'
import type { ComplaintPhoto, RaiseComplaintForm } from '../../../types/raiseComplaint'
import type { ComplaintSubmitMeta } from '../../../lib/raiseComplaintFormat'
import { PhotoGallery } from './PhotoGallery'
import { SimilarComplaintsBanner } from './SimilarComplaintsBanner'

type Props = {
  form: RaiseComplaintForm
  photos: ComplaintPhoto[]
  wardName: string
  phone?: string
  submitMeta: ComplaintSubmitMeta
  similarCount: number
  clusterCount: number
  hasSimilar: boolean
  onEdit: (step: 'where' | 'what' | 'details') => void
}

export function RaiseComplaintReviewPanel({
  form,
  photos,
  wardName,
  phone,
  submitMeta,
  similarCount,
  clusterCount,
  hasSimilar,
  onEdit,
}: Props) {
  const { t } = useTranslation('complaints')
  const primaryCategory = getPrimaryCategory(form.categories)
  const categoryLabel = getCategoriesDisplayLabel(form, (category) =>
    t(`raise.categories.${category}`),
  )
  const formattedSubmission = buildComplaintDescription(form, submitMeta)
  const locationDisplay = buildLocationDetail(form) ?? t('raise.review.notProvided')

  const rows: Array<{
    section: 'where' | 'what' | 'details'
    label: string
    value: string
    optional?: boolean
    multiline?: boolean
  }> = [
    { section: 'where', label: t('raise.review.fields.ward'), value: wardName },
    {
      section: 'where',
      label: t('raise.review.fields.location'),
      value: locationDisplay,
      optional: !form.locationDetail.trim() && form.latitude == null,
      multiline: true,
    },
    {
      section: 'where',
      label: t('raise.review.fields.gps'),
      value:
        form.latitude != null && form.longitude != null
          ? formatCoordinates(form.latitude, form.longitude)
          : t('raise.review.notProvided'),
      optional: form.latitude == null,
    },
    {
      section: 'where',
      label: t('raise.review.fields.contact'),
      value: phone ? `+91 ${phone}` : t('raise.review.notProvided'),
    },
    { section: 'what', label: t('raise.review.fields.categories'), value: categoryLabel },
    {
      section: 'details',
      label: t('raise.review.fields.priority'),
      value: t(`raise.details.priorityOptions.${form.priority}`),
    },
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
      multiline: true,
    },
    {
      section: 'details',
      label: t('raise.review.fields.duration'),
      value: form.duration
        ? submitMeta.duration[form.duration]
        : t('raise.review.notProvided'),
      optional: !form.duration,
    },
    {
      section: 'details',
      label: t('raise.review.fields.impact'),
      value: form.impact
        ? submitMeta.impact[form.impact]
        : t('raise.review.notProvided'),
      optional: !form.impact,
    },
    {
      section: 'details',
      label: t('raise.review.fields.photos'),
      value:
        photos.length > 0
          ? t('detail.attachments.count', { count: photos.length })
          : t('raise.review.notProvided'),
      optional: photos.length === 0,
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
                    } ${row.multiline ? 'whitespace-pre-wrap' : ''}`}
                  >
                    {row.value}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        )
      })}

      {photos.length > 0 && <PhotoGallery compact photos={photos} />}

      {hasSimilar && (
        <SimilarComplaintsBanner
          category={primaryCategory}
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
