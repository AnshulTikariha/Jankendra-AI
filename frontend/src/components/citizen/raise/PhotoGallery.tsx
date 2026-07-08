import { useTranslation } from 'react-i18next'
import type { ComplaintPhoto } from '../../../types/raiseComplaint'

type Props = {
  photos: ComplaintPhoto[]
  compact?: boolean
}

export function PhotoGallery({ photos, compact = false }: Props) {
  const { t } = useTranslation('complaints')

  if (photos.length === 0) return null

  return (
    <div className={compact ? 'space-y-2' : 'overflow-hidden rounded-2xl border border-line/80 bg-white shadow-sm'}>
      {!compact && (
        <div className="border-b border-line/60 bg-slate-50/80 px-4 py-3">
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-muted">
            {t('detail.attachments.title')}
          </p>
          <p className="mt-1 text-xs text-muted">{t('detail.attachments.previewNote')}</p>
        </div>
      )}
      <div className={`grid gap-2 ${compact ? 'grid-cols-3' : 'grid-cols-2 p-4 sm:grid-cols-3'}`}>
        {photos.map((photo) => (
          <a
            className="block overflow-hidden rounded-xl border border-line/80"
            href={photo.dataUrl}
            key={photo.id}
            rel="noopener noreferrer"
            target="_blank"
          >
            <img
              alt={photo.name}
              className="aspect-square w-full object-cover"
              loading="lazy"
              src={photo.dataUrl}
            />
          </a>
        ))}
      </div>
    </div>
  )
}
