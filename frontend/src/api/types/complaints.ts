export type ApiComplaint = {
  id: string
  public_reference: string
  ward_id: number
  ward_name: string
  ward_code: string | null
  category: string
  description: string
  location_detail: string | null
  status: string
  cluster_count: number
  source: string
  submitted_at: string
  updated_at: string | null
  reporter_phone: string | null
  department_suggestion: string | null
  assigned_department: string | null
  staff_note: string | null
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

export type UpdateComplaintPayload = {
  status?: string
  assigned_department?: string
  staff_note?: string
}
