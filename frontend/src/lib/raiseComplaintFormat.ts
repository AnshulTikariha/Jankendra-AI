import type { CreateComplaintPayload } from '../api/types/complaints'
import type {
  ComplaintDuration,
  ComplaintImpact,
  RaiseComplaintForm,
} from '../types/raiseComplaint'

type MetaLabels = {
  duration: Record<ComplaintDuration, string>
  impact: Record<ComplaintImpact, string>
}

export function buildComplaintDescription(
  form: RaiseComplaintForm,
  metaLabels: MetaLabels,
): string {
  const parts: string[] = []

  if (form.title.trim()) {
    parts.push(form.title.trim())
    parts.push('')
  }

  parts.push(form.description.trim())

  const meta: string[] = []
  if (form.category === 'other' && form.customCategory.trim()) {
    meta.push(`Category: ${form.customCategory.trim()}`)
  }
  if (form.duration) {
    meta.push(`When: ${metaLabels.duration[form.duration]}`)
  }
  if (form.impact) {
    meta.push(`Impact: ${metaLabels.impact[form.impact]}`)
  }

  if (meta.length > 0) {
    parts.push('')
    parts.push('---')
    parts.push('Additional details:')
    for (const line of meta) {
      parts.push(`- ${line}`)
    }
  }

  return parts.join('\n')
}

export function formToCreatePayload(
  form: RaiseComplaintForm,
  metaLabels: MetaLabels,
): CreateComplaintPayload {
  return {
    ward_id: form.wardId,
    category: form.category,
    description: buildComplaintDescription(form, metaLabels),
    location_detail: form.locationDetail.trim() || undefined,
  }
}

export function getCategoryDisplayLabel(
  form: RaiseComplaintForm,
  defaultLabel: string,
): string {
  if (form.category === 'other' && form.customCategory.trim()) {
    return form.customCategory.trim()
  }
  return defaultLabel
}

export function descriptionQuality(length: number): 'empty' | 'short' | 'good' | 'long' {
  if (length === 0) return 'empty'
  if (length < 20) return 'short'
  if (length <= 400) return 'good'
  return 'long'
}
