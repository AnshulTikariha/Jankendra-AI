import type { CreateComplaintPayload } from '../api/types/complaints'
import type { ComplaintCategory } from '../types/complaint'
import type {
  ComplaintDuration,
  ComplaintImpact,
  ComplaintPriority,
  RaiseComplaintForm,
} from '../types/raiseComplaint'

export type ComplaintSubmitMeta = {
  duration: Record<ComplaintDuration, string>
  impact: Record<ComplaintImpact, string>
  priority: Record<ComplaintPriority, string>
  subCategoryLabel?: string
  categoryLabels?: string[]
}

export function getPrimaryCategory(categories: ComplaintCategory[]): ComplaintCategory {
  return categories.find((category) => category !== 'other') ?? categories[0] ?? 'other'
}

export function isOnlyOtherCategory(categories: ComplaintCategory[]): boolean {
  return categories.length === 1 && categories[0] === 'other'
}

export function includesOtherCategory(categories: ComplaintCategory[]): boolean {
  return categories.includes('other')
}

export function getCategoriesDisplayLabel(
  form: RaiseComplaintForm,
  labelFor: (category: ComplaintCategory) => string,
): string {
  if (form.categories.length === 0) return labelFor('water')

  return form.categories
    .map((category) => {
      if (category === 'other' && form.customCategory.trim()) {
        return form.customCategory.trim()
      }
      return labelFor(category)
    })
    .join(', ')
}

export function buildLocationDetail(form: RaiseComplaintForm): string | undefined {
  const parts: string[] = []
  if (form.locationDetail.trim()) {
    parts.push(form.locationDetail.trim())
  }
  if (form.latitude != null && form.longitude != null) {
    parts.push(`GPS: ${form.latitude.toFixed(6)}, ${form.longitude.toFixed(6)}`)
  }
  return parts.length > 0 ? parts.join('\n') : undefined
}

export function buildComplaintDescription(
  form: RaiseComplaintForm,
  meta: ComplaintSubmitMeta,
): string {
  const parts: string[] = []

  if (form.title.trim()) {
    parts.push(form.title.trim())
    parts.push('')
  }

  parts.push(form.description.trim())

  const details: string[] = []
  const categoryLine =
    meta.categoryLabels && meta.categoryLabels.length > 0
      ? meta.categoryLabels.join(', ')
      : undefined

  if (categoryLine) {
    details.push(`Problem type(s): ${categoryLine}`)
  } else if (isOnlyOtherCategory(form.categories) && form.customCategory.trim()) {
    details.push(`Category: ${form.customCategory.trim()}`)
  }

  if (meta.subCategoryLabel) {
    details.push(`Sub-category: ${meta.subCategoryLabel}`)
  }
  details.push(`Priority: ${meta.priority[form.priority]}`)
  if (form.duration) {
    details.push(`When: ${meta.duration[form.duration]}`)
  }
  if (form.impact) {
    details.push(`Impact: ${meta.impact[form.impact]}`)
  }

  if (details.length > 0) {
    parts.push('')
    parts.push('---')
    parts.push('Additional details:')
    for (const line of details) {
      parts.push(`- ${line}`)
    }
  }

  return parts.join('\n')
}

export function formToCreatePayload(
  form: RaiseComplaintForm,
  meta: ComplaintSubmitMeta,
): CreateComplaintPayload {
  if (form.wardId === '') {
    throw new Error('Ward is required to submit a complaint')
  }

  return {
    ward_id: form.wardId,
    category: getPrimaryCategory(form.categories),
    description: buildComplaintDescription(form, meta),
    location_detail: buildLocationDetail(form),
  }
}

export function getCategoryDisplayLabel(
  form: RaiseComplaintForm,
  defaultLabel: string,
): string {
  return getCategoriesDisplayLabel(form, () => defaultLabel)
}

export function formatCoordinates(lat: number, lng: number): string {
  return `${lat.toFixed(6)}, ${lng.toFixed(6)}`
}

export function parseComplaintMetadata(description: string): {
  priority?: string
  subCategory?: string
} {
  const priorityMatch = description.match(/- Priority: (.+)/)
  const subCategoryMatch = description.match(/- Sub-category: (.+)/)
  return {
    priority: priorityMatch?.[1]?.trim(),
    subCategory: subCategoryMatch?.[1]?.trim(),
  }
}

export function descriptionQuality(length: number): 'empty' | 'short' | 'good' | 'long' {
  if (length === 0) return 'empty'
  if (length < 20) return 'short'
  if (length <= 400) return 'good'
  return 'long'
}
