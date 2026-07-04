export type ApiComplaint = {
  id: string
  public_reference: string
  ward_id: number
  ward_name: string
  category: string
  description: string
  location_detail: string | null
  status: string
  cluster_count: number
  source: string
  submitted_at: string
  reporter_phone: string | null
  department_suggestion: string | null
}

export type ApiComplaintListResponse = {
  total: number
  complaints: ApiComplaint[]
}

export type CreateComplaintPayload = {
  ward_id: number
  category: string
  description: string
  location_detail?: string
}
