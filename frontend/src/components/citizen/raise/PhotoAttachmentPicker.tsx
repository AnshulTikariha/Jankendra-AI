import { useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  MAX_COMPLAINT_PHOTOS,
  MAX_PHOTO_BYTES,
  type ComplaintPhoto,
} from '../../../types/raiseComplaint'

type Props = {
  photos: ComplaintPhoto[]
  onChange: (photos: ComplaintPhoto[]) => void
}

function createPhotoId() {
  return `photo-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

export function PhotoAttachmentPicker({ photos, onChange }: Props) {
  const { t } = useTranslation('complaints')
  const inputRef = useRef<HTMLInputElement>(null)
  const [error, setError] = useState<string | null>(null)

  const handleFiles = async (fileList: FileList | null) => {
    if (!fileList?.length) return
    setError(null)

    const remaining = MAX_COMPLAINT_PHOTOS - photos.length
    if (remaining <= 0) {
      setError(t('raise.details.photos.maxReached', { max: MAX_COMPLAINT_PHOTOS }))
      return
    }

    const files = Array.from(fileList).slice(0, remaining)
    const nextPhotos = [...photos]

    for (const file of files) {
      if (!file.type.startsWith('image/')) {
        setError(t('raise.details.photos.invalidType'))
        continue
      }
      if (file.size > MAX_PHOTO_BYTES) {
        setError(t('raise.details.photos.tooLarge', { maxKb: Math.round(MAX_PHOTO_BYTES / 1024) }))
        continue
      }

      const dataUrl = await readFileAsDataUrl(file)
      nextPhotos.push({
        id: createPhotoId(),
        name: file.name,
        dataUrl,
        mimeType: file.type,
      })
    }

    onChange(nextPhotos)
    if (inputRef.current) inputRef.current.value = ''
  }

  const removePhoto = (id: string) => {
    onChange(photos.filter((photo) => photo.id !== id))
    setError(null)
  }

  return (
    <div className="rounded-2xl border border-line/80 bg-white p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="text-sm font-bold">{t('raise.details.photos.title')}</p>
          <p className="mt-0.5 text-xs text-muted">{t('raise.details.photos.hint')}</p>
        </div>
        <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[0.65rem] font-bold text-amber-800">
          {t('raise.previewBadge')}
        </span>
      </div>

      {photos.length > 0 && (
        <div className="mt-3 grid grid-cols-3 gap-2">
          {photos.map((photo) => (
            <div className="relative overflow-hidden rounded-xl border border-line/80" key={photo.id}>
              <img
                alt={photo.name}
                className="aspect-square w-full object-cover"
                src={photo.dataUrl}
              />
              <button
                aria-label={t('raise.details.photos.remove')}
                className="absolute right-1 top-1 rounded-full bg-black/60 px-2 py-0.5 text-[0.65rem] font-bold text-white"
                onClick={() => removePhoto(photo.id)}
                type="button"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      {photos.length < MAX_COMPLAINT_PHOTOS && (
        <div className="mt-3">
          <input
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={(e) => void handleFiles(e.target.files)}
            ref={inputRef}
            type="file"
          />
          <button
            className="rounded-full border border-teal-200 bg-teal-50 px-4 py-2 text-xs font-extrabold text-teal-800"
            onClick={() => inputRef.current?.click()}
            type="button"
          >
            {t('raise.details.photos.add')}
          </button>
          <p className="mt-2 text-xs text-muted">
            {t('raise.details.photos.count', { count: photos.length, max: MAX_COMPLAINT_PHOTOS })}
          </p>
        </div>
      )}

      {error && <p className="mt-2 text-xs font-semibold text-red-600">{error}</p>}
    </div>
  )
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(file)
  })
}
