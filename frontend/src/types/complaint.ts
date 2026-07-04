export type ComplaintCategory =
  | 'water'
  | 'roads'
  | 'drainage'
  | 'electricity'
  | 'health'
  | 'sanitation'
  | 'other'

export type CitizenComplaintStatus =
  | 'submitted'
  | 'under_review'
  | 'in_progress'
  | 'resolved'

export type Complaint = {
  id: string
  publicReference: string
  wardId: string
  wardName: string
  category: ComplaintCategory
  description: string
  locationDetail?: string
  status: CitizenComplaintStatus
  clusterCount: number
  source: 'citizen' | 'staff'
  submittedAt: string
  reporterPhone: string
  departmentSuggestion?: string
}

export const complaintCategoryLabels: Record<ComplaintCategory, string> = {
  water: 'Water supply',
  roads: 'Roads',
  drainage: 'Drainage',
  electricity: 'Electricity',
  health: 'Health',
  sanitation: 'Sanitation',
  other: 'Other',
}

export const citizenStatusLabels: Record<CitizenComplaintStatus, string> = {
  submitted: 'Submitted',
  under_review: 'Under review',
  in_progress: 'In progress',
  resolved: 'Resolved',
}
