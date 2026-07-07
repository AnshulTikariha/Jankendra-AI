import type { ComplaintCategory } from '../types/complaint'

const DEPARTMENT_BY_CATEGORY: Record<ComplaintCategory, string> = {
  water: 'WMD',
  roads: 'PWD',
  drainage: 'PWD',
  electricity: 'Electricity Dept',
  health: 'Health',
  sanitation: 'WMD',
  other: 'General Administration',
}

const REASON_BY_CATEGORY: Record<ComplaintCategory, string> = {
  water: 'Water supply issues are handled by the Water Management Department.',
  roads: 'Road and footpath repairs fall under Public Works.',
  drainage: 'Drainage and sewage work is managed by Public Works.',
  electricity: 'Power and street-light faults are handled by the Electricity Department.',
  health: 'Health hazards are routed to the Health Department.',
  sanitation: 'Garbage and sanitation are handled by the Water Management Department.',
  other: 'No specific department matched — route via General Administration.',
}

const categories: ComplaintCategory[] = [
  'water',
  'roads',
  'drainage',
  'electricity',
  'health',
  'sanitation',
  'other',
]

function normalizeCategory(category: string): ComplaintCategory {
  const value = category.toLowerCase()
  return categories.includes(value as ComplaintCategory)
    ? (value as ComplaintCategory)
    : 'other'
}

export function suggestDepartment(category: string): {
  department: string
  reason: string
} {
  const key = normalizeCategory(category)
  return {
    department: DEPARTMENT_BY_CATEGORY[key],
    reason: REASON_BY_CATEGORY[key],
  }
}
