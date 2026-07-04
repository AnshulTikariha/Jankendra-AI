import type { ComplaintCategory } from './complaint'

export type ComplaintDuration =
  | 'today'
  | 'this_week'
  | 'this_month'
  | 'over_month'
  | 'long_standing'

export type ComplaintImpact =
  | 'individual'
  | 'neighbours'
  | 'street'
  | 'public'

export type RaiseComplaintForm = {
  wardId: number
  category: ComplaintCategory
  customCategory: string
  locationDetail: string
  title: string
  description: string
  duration: ComplaintDuration | ''
  impact: ComplaintImpact | ''
}

export const defaultRaiseComplaintForm = (
  wardId = 1,
): RaiseComplaintForm => ({
  wardId,
  category: 'water',
  customCategory: '',
  locationDetail: '',
  title: '',
  description: '',
  duration: '',
  impact: '',
})

export type RaiseComplaintStep = 'where' | 'what' | 'details' | 'review'

export const raiseComplaintSteps: RaiseComplaintStep[] = [
  'where',
  'what',
  'details',
  'review',
]
