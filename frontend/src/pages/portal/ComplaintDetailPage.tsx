import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { PhotoGallery } from '../../components/citizen/raise/PhotoGallery'
import { useComplaint } from '../../hooks/useComplaints'
import { useExploreComplaint } from '../../hooks/useExploreComplaints'
import { parseComplaintMetadata, getComplaintDisplayTitle, formatComplaintWardLabel } from '../../lib/raiseComplaintFormat'
import { useComplaintAttachmentsStore } from '../../stores/useComplaintAttachmentsStore'
import { useUiStore } from '../../stores/useUiStore'
import { ApiError } from '../../api/errors'
import {
  citizenStatusLabels,
  complaintCategoryLabels,
  type CitizenComplaintStatus,
} from '../../types/complaint'

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

const statusOrder: CitizenComplaintStatus[] = [
  'submitted',
  'under_review',
  'in_progress',
  'resolved',
]

const statusColors: Record<CitizenComplaintStatus, string> = {
  submitted: 'bg-slate-100 text-slate-700',
  under_review: 'bg-amber-100 text-amber-800',
  in_progress: 'bg-blue-100 text-blue-700',
  resolved: 'bg-emerald-100 text-emerald-800',
}

function StatusStepper({ status }: { status: CitizenComplaintStatus }) {
  const currentIndex = statusOrder.indexOf(status)

  return (
    <div className="mt-4 flex items-center gap-1">
      {statusOrder.map((step, index) => (
        <div className="flex flex-1 items-center gap-1" key={step}>
          <div
            className={`size-2.5 shrink-0 rounded-full ${
              index <= currentIndex
                ? index === currentIndex
                  ? 'bg-teal-500 ring-2 ring-teal-200'
                  : 'bg-teal-400'
                : 'bg-slate-200'
            }`}
          />
          {index < statusOrder.length - 1 && (
            <div
              className={`h-0.5 flex-1 rounded ${index < currentIndex ? 'bg-teal-400' : 'bg-slate-200'}`}
            />
          )}
        </div>
      ))}
    </div>
  )
}

export function ComplaintDetailPage() {
  const { t } = useTranslation('complaints')
  const viewingComplaintId = useUiStore((s) => s.viewingComplaintId)
  const complaintDetailSource = useUiStore((s) => s.complaintDetailSource)
  const exploreLocation = useUiStore((s) => s.exploreLocation)
  const setCitizenView = useUiStore((s) => s.setCitizenView)
  const setViewingComplaintId = useUiStore((s) => s.setViewingComplaintId)
  const isExploreReadOnly = complaintDetailSource === 'ward-updates'
  const ownComplaintQuery = useComplaint(isExploreReadOnly ? null : viewingComplaintId)
  const exploreComplaintQuery = useExploreComplaint(
    isExploreReadOnly ? viewingComplaintId : null,
    exploreLocation,
  )
  const complaintQuery = isExploreReadOnly ? exploreComplaintQuery : ownComplaintQuery
  const { data: complaint, isPending, isFetching, isError, error } = complaintQuery
  const isLoadingDetail = isPending || isFetching
  const attachments = useComplaintAttachmentsStore((s) =>
    viewingComplaintId ? s.attachments[viewingComplaintId] : undefined,
  )
  const [copied, setCopied] = useState(false)

  const handleBack = () => {
    setViewingComplaintId(null)
    setCitizenView(isExploreReadOnly ? 'ward-updates' : 'my-complaints')
  }

  const backLabel = isExploreReadOnly ? t('wardUpdates.backToGrid') : t('detail.backToList')

  const handleCopy = async () => {
    if (!complaint?.publicReference) return
    try {
      await navigator.clipboard.writeText(complaint.publicReference)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // clipboard unavailable
    }
  }

  if (!viewingComplaintId) {
    return (
      <section className="rounded-3xl border border-dashed border-slate-300 bg-white p-8 text-center">
        <p className="text-sm font-semibold text-muted">{t('detail.notSelected')}</p>
        <button
          className="mt-4 rounded-full bg-teal-600 px-5 py-2.5 text-sm font-extrabold text-white"
          onClick={handleBack}
          type="button"
        >
          {backLabel}
        </button>
      </section>
    )
  }

  if (isLoadingDetail) {
    return (
      <section className="flex min-h-[20rem] flex-col items-center justify-center rounded-3xl border border-dashed border-slate-300/80 bg-white/80 p-8 text-center shadow-sm">
        <div className="size-10 animate-spin rounded-full border-4 border-teal-200 border-t-teal-600" />
        <p className="mt-4 text-sm font-semibold text-muted">{t('detail.loading')}</p>
      </section>
    )
  }

  if (isError || !complaint) {
    const message =
      error instanceof ApiError ? error.message : t('detail.loadError')
    return (
      <section className="flex min-h-[20rem] flex-col items-center justify-center rounded-3xl border border-red-200 bg-red-50/80 p-8 text-center shadow-sm">
        <p className="text-lg font-extrabold text-red-800">{t('detail.loadFailed')}</p>
        <p className="mt-2 text-sm text-red-700">{message}</p>
        <button
          className="mt-4 rounded-full bg-teal-600 px-5 py-2.5 text-sm font-extrabold text-white"
          onClick={handleBack}
          type="button"
        >
          {backLabel}
        </button>
      </section>
    )
  }

  const metadata = parseComplaintMetadata(complaint.description)
  const displayTitle = getComplaintDisplayTitle(
    complaint,
    complaintCategoryLabels[complaint.category],
  )

  const detailRows = [
    { label: t('detail.fields.reference'), value: complaint.publicReference },
    { label: t('detail.fields.status'), value: citizenStatusLabels[complaint.status] },
    { label: t('detail.fields.title'), value: displayTitle },
    { label: t('detail.fields.category'), value: complaintCategoryLabels[complaint.category] },
    ...(metadata.subCategory
      ? [{ label: t('detail.fields.subCategory'), value: metadata.subCategory }]
      : []),
    ...(metadata.priority
      ? [{ label: t('detail.fields.priority'), value: metadata.priority }]
      : []),
    { label: t('detail.fields.ward'), value: formatComplaintWardLabel(complaint) },
    {
      label: t('detail.fields.location'),
      value: complaint.locationDetail ?? t('raise.review.notProvided'),
      muted: !complaint.locationDetail,
    },
    { label: t('detail.fields.submitted'), value: formatDateTime(complaint.submittedAt) },
    ...(!isExploreReadOnly && complaint.reporterPhone
      ? [{ label: t('detail.fields.contact'), value: `+91 ${complaint.reporterPhone}` }]
      : []),
    {
      label: t('detail.fields.cluster'),
      value:
        complaint.clusterCount > 1
          ? t('detail.clusterCount', { count: complaint.clusterCount })
          : t('detail.clusterSingle'),
    },
  ]

  return (
    <section className="space-y-4">
      <div className="overflow-hidden rounded-3xl border border-line/80 bg-white shadow-md">
        <div className="border-b border-line/80 bg-gradient-to-r from-teal-50/50 to-white px-5 py-4 sm:px-6">
          <button
            className="text-xs font-bold text-teal-700"
            onClick={handleBack}
            type="button"
          >
            ← {backLabel}
          </button>
          {isExploreReadOnly && (
            <span className="mt-2 inline-flex rounded-full bg-amber-100 px-3 py-1 text-[0.65rem] font-bold uppercase tracking-wide text-amber-800">
              {t('wardUpdates.readOnly')}
            </span>
          )}
          <p className="mt-3 text-xs font-bold uppercase tracking-[0.18em] text-accent">
            {t('detail.eyebrow')}
          </p>
          <h1 className="mt-1 font-mono text-2xl font-extrabold text-teal-700">
            {complaint.publicReference}
          </h1>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span className={`rounded-full px-3 py-1 text-xs font-bold ${statusColors[complaint.status]}`}>
              {citizenStatusLabels[complaint.status]}
            </span>
            <button
              className="rounded-full border border-teal-200 bg-white px-3 py-1 text-xs font-extrabold text-teal-700"
              onClick={() => void handleCopy()}
              type="button"
            >
              {copied ? t('confirmation.copied') : t('confirmation.copy')}
            </button>
          </div>
        </div>

        <div className="p-5 sm:p-6">
          <StatusStepper status={complaint.status} />
          <div className="mt-3 flex flex-wrap gap-2">
            {statusOrder.map((step) => (
              <span className="text-[0.6rem] font-semibold text-muted" key={step}>
                {citizenStatusLabels[step]}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-3xl border border-line/80 bg-white shadow-md">
        <div className="border-b border-line/60 bg-slate-50/80 px-5 py-3">
          <h2 className="text-sm font-extrabold">{t('detail.fullDetails')}</h2>
        </div>
        <dl className="divide-y divide-line/50">
          {detailRows.map((row) => (
            <div className="grid gap-1 px-5 py-4 sm:grid-cols-[10rem_1fr]" key={row.label}>
              <dt className="text-xs font-bold uppercase tracking-wide text-muted">{row.label}</dt>
              <dd className={`font-semibold ${row.muted ? 'text-muted' : 'text-ink'}`}>{row.value}</dd>
            </div>
          ))}
        </dl>
      </div>

      {attachments && attachments.length > 0 && <PhotoGallery photos={attachments} />}

      <div className="overflow-hidden rounded-3xl border border-line/80 bg-white shadow-md">
        <div className="border-b border-line/60 bg-slate-50/80 px-5 py-3">
          <h2 className="text-sm font-extrabold">{t('detail.fields.description')}</h2>
        </div>
        <div className="px-5 py-4">
          <p className="whitespace-pre-wrap text-sm leading-7 text-ink">{complaint.description}</p>
        </div>
      </div>
    </section>
  )
}
