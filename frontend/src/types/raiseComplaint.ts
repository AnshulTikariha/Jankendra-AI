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

export type ComplaintPriority = 'low' | 'medium' | 'high' | 'critical'

export type ComplaintPhoto = {
  id: string
  name: string
  dataUrl: string
  mimeType: string
}

export type RaiseComplaintForm = {
  wardId: number | ''
  categories: ComplaintCategory[]
  subCategory: string
  customCategory: string
  locationDetail: string
  latitude: number | null
  longitude: number | null
  title: string
  description: string
  duration: ComplaintDuration | ''
  impact: ComplaintImpact | ''
  priority: ComplaintPriority
}

export const defaultRaiseComplaintForm = (
  wardId: number | '' = '',
): RaiseComplaintForm => ({
  wardId,
  categories: ['water'],
  subCategory: '',
  customCategory: '',
  locationDetail: '',
  latitude: null,
  longitude: null,
  title: '',
  description: '',
  duration: '',
  impact: '',
  priority: 'medium',
})

export type RaiseComplaintStep = 'where' | 'what' | 'details' | 'review'

export const raiseComplaintSteps: RaiseComplaintStep[] = [
  'where',
  'what',
  'details',
  'review',
]

export const MAX_COMPLAINT_PHOTOS = 3
export const MAX_PHOTO_BYTES = 800_000
