import type { ComplaintTextAnalysisResponse } from '../api/complaintAnalysis'
import type { ComplaintCategory } from '../types/complaint'
import type { ComplaintPriority, RaiseComplaintForm } from '../types/raiseComplaint'

const ALLOWED_CATEGORIES: ComplaintCategory[] = [
  'water',
  'roads',
  'drainage',
  'electricity',
  'health',
  'sanitation',
  'other',
]

const SEVERITY_TO_PRIORITY: Record<string, ComplaintPriority> = {
  low: 'low',
  medium: 'medium',
  high: 'high',
  critical: 'critical',
}

export type ComplaintAnalysisSuggestions = {
  title?: string
  locationDetail?: string
  categories?: ComplaintCategory[]
  priority?: ComplaintPriority
  geocodeQuery?: string
}

export function isDefaultCategories(categories: ComplaintCategory[]): boolean {
  return categories.length === 1 && categories[0] === 'water'
}

export function mapAnalysisToSuggestions(
  analysis: ComplaintTextAnalysisResponse,
): ComplaintAnalysisSuggestions {
  const categories = analysis.categories.filter((item): item is ComplaintCategory =>
    ALLOWED_CATEGORIES.includes(item as ComplaintCategory),
  )

  const location = normalizeAnalysisLocation(analysis.location)

  return {
    title: analysis.summary.trim() || undefined,
    locationDetail: location,
    categories: categories.length > 0 ? categories : undefined,
    priority: SEVERITY_TO_PRIORITY[analysis.severity] ?? undefined,
    geocodeQuery: location,
  }
}

function normalizeAnalysisLocation(value: string | null | undefined): string | undefined {
  if (!value?.trim()) {
    return undefined
  }

  const trimmed = value.trim()
  if (/^(null|none|n\/a|na|unknown|not mentioned|not specified)$/i.test(trimmed)) {
    return undefined
  }

  return trimmed
}

export type ApplySuggestionsOptions = {
  form: RaiseComplaintForm
  suggestions: ComplaintAnalysisSuggestions
  touched: ReadonlySet<keyof RaiseComplaintForm | 'map'>
}

export function buildFormPatches(
  options: ApplySuggestionsOptions,
): Partial<RaiseComplaintForm> {
  const { form, suggestions, touched } = options
  const patch: Partial<RaiseComplaintForm> = {}

  if (!touched.has('title') && !form.title.trim() && suggestions.title) {
    patch.title = suggestions.title.slice(0, 120)
  }

  if (
    !touched.has('locationDetail') &&
    !form.locationDetail.trim() &&
    suggestions.locationDetail
  ) {
    patch.locationDetail = suggestions.locationDetail
  }

  if (
    !touched.has('categories') &&
    isDefaultCategories(form.categories) &&
    suggestions.categories
  ) {
    patch.categories = suggestions.categories
  }

  if (
    !touched.has('priority') &&
    form.priority === 'medium' &&
    suggestions.priority
  ) {
    patch.priority = suggestions.priority
  }

  return patch
}
