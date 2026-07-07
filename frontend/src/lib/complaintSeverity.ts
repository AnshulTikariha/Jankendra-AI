import { parseComplaintMetadata } from './raiseComplaintFormat'

export type ComplaintSeverity = 'low' | 'medium' | 'high' | 'critical'

export const severityByLabel: Record<string, ComplaintSeverity> = {
  low: 'low',
  medium: 'medium',
  high: 'high',
  critical: 'critical',
  कम: 'low',
  मध्यम: 'medium',
  अधिक: 'high',
  अत्यावश्यक: 'critical',
}

export const severityCardStyles: Record<ComplaintSeverity, string> = {
  critical: 'border-l-4 border-l-rose-500 bg-rose-50/50',
  high: 'border-l-4 border-l-orange-400 bg-orange-50/50',
  medium: 'border-l-4 border-l-amber-400 bg-amber-50/40',
  low: 'border-l-4 border-l-emerald-400 bg-emerald-50/30',
}

export const severityBadgeStyles: Record<ComplaintSeverity, string> = {
  critical: 'bg-rose-100 text-rose-800',
  high: 'bg-orange-100 text-orange-800',
  medium: 'bg-amber-100 text-amber-800',
  low: 'bg-emerald-100 text-emerald-800',
}

export const severityLabels: Record<ComplaintSeverity, string> = {
  critical: 'Critical',
  high: 'High',
  medium: 'Medium',
  low: 'Low',
}

export function getComplaintSeverity(description: string): ComplaintSeverity | null {
  const { priority } = parseComplaintMetadata(description)
  if (!priority) return null
  return severityByLabel[priority.trim().toLowerCase()] ?? severityByLabel[priority.trim()] ?? null
}
