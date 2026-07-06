import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useComplaint } from '../../hooks/useComplaints'
import { useComplaintAttachmentsStore } from '../../stores/useComplaintAttachmentsStore'
import { useUiStore } from '../../stores/useUiStore'
import { complaintCategoryLabels } from '../../types/complaint'
import { getComplaintDisplayTitle, formatComplaintWardLabel } from '../../lib/raiseComplaintFormat'

export function ComplaintConfirmationPage() {
  const { t } = useTranslation('complaints')
  const lastComplaintRef = useUiStore((s) => s.lastComplaintRef)
  const lastComplaintId = useUiStore((s) => s.lastComplaintId)
  const setCitizenView = useUiStore((s) => s.setCitizenView)
  const setViewingComplaintId = useUiStore((s) => s.setViewingComplaintId)
  const { data: complaint, isLoading } = useComplaint(lastComplaintId)
  const attachmentCount = useComplaintAttachmentsStore((s) =>
    lastComplaintId ? s.getAttachments(lastComplaintId).length : 0,
  )
  const [copied, setCopied] = useState(false)

  const reference = complaint?.publicReference ?? lastComplaintRef

  const handleCopy = async () => {
    if (!reference) return
    try {
      await navigator.clipboard.writeText(reference)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // clipboard unavailable
    }
  }

  const handleShare = async () => {
    if (!reference) return
    const text = t('confirmation.shareText', { ref: reference })

    if (navigator.share) {
      try {
        await navigator.share({ title: t('confirmation.title'), text })
        return
      } catch {
        // user cancelled or share failed
      }
    }

    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(text)}`
    window.open(whatsappUrl, '_blank', 'noopener,noreferrer')
  }

  const handleReportAnother = () => {
    setCitizenView('raise')
  }

  return (
    <section className="relative overflow-hidden rounded-3xl border border-emerald-200/60 bg-gradient-to-br from-emerald-50 via-white to-teal-50 p-8 text-center shadow-lg">
      <div className="absolute -right-10 -top-10 size-32 rounded-full bg-emerald-200/30 blur-3xl" />
      <div className="relative">
        <div className="mx-auto grid size-16 place-items-center rounded-2xl bg-gradient-to-br from-teal-500 to-emerald-600 text-2xl font-extrabold text-white shadow-lg">
          ✓
        </div>
        <h1 className="mt-5 text-2xl font-extrabold">{t('confirmation.title')}</h1>
        <p className="mt-2 text-sm text-muted">{t('confirmation.subtitle')}</p>
        {isLoading && !reference && (
          <p className="mt-5 text-sm font-semibold text-muted">{t('confirmation.loading')}</p>
        )}
        {reference && (
          <p className="mt-5 font-mono text-2xl font-extrabold text-teal-700">{reference}</p>
        )}
        {complaint && (
          <div className="mx-auto mt-5 max-w-md rounded-2xl border border-emerald-100 bg-white/80 px-4 py-3 text-left text-sm">
            <p className="font-bold text-ink">
              {getComplaintDisplayTitle(complaint, complaintCategoryLabels[complaint.category])}
            </p>
            <p className="mt-1 text-muted">{formatComplaintWardLabel(complaint)}</p>
            {complaint.locationDetail && (
              <p className="mt-1 text-xs text-muted">{complaint.locationDetail}</p>
            )}
            {attachmentCount > 0 && (
              <p className="mt-2 text-xs font-semibold text-muted">
                {t('detail.attachments.count', { count: attachmentCount })}
              </p>
            )}
          </div>
        )}

        {reference && (
          <div className="mx-auto mt-5 flex max-w-sm flex-wrap justify-center gap-2">
            <button
              className="rounded-full border border-teal-200 bg-white px-4 py-2 text-xs font-extrabold text-teal-700 shadow-sm"
              onClick={() => void handleCopy()}
              type="button"
            >
              {copied ? t('confirmation.copied') : t('confirmation.copy')}
            </button>
            <button
              className="rounded-full border border-teal-200 bg-white px-4 py-2 text-xs font-extrabold text-teal-700 shadow-sm"
              onClick={() => void handleShare()}
              type="button"
            >
              {t('confirmation.share')}
            </button>
          </div>
        )}

        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:justify-center">
          {lastComplaintId && (
            <button
              className="rounded-full border border-teal-300 bg-teal-50 px-6 py-3 text-sm font-extrabold text-teal-800"
              onClick={() => {
                setViewingComplaintId(lastComplaintId)
                setCitizenView('complaint-detail')
              }}
              type="button"
            >
              {t('detail.viewDetails')}
            </button>
          )}
          <button
            className="rounded-full bg-gradient-to-r from-teal-600 to-emerald-600 px-6 py-3 text-sm font-extrabold text-white shadow-lg"
            onClick={() => setCitizenView('my-complaints')}
            type="button"
          >
            {t('confirmation.viewComplaints')}
          </button>
          <button
            className="rounded-full border border-line bg-white px-6 py-3 text-sm font-extrabold text-teal-700 transition hover:bg-teal-50"
            onClick={handleReportAnother}
            type="button"
          >
            {t('confirmation.reportAnother')}
          </button>
          <button
            className="rounded-full border border-line bg-white px-6 py-3 text-sm font-extrabold text-teal-700 transition hover:bg-teal-50"
            onClick={() => setCitizenView('home')}
            type="button"
          >
            {t('confirmation.backHome')}
          </button>
        </div>
      </div>
    </section>
  )
}
