export type ApiCommitment = {
  id: string
  title: string
  description: string
  ward_id: number | null
  ward_name: string | null
  assignee: string | null
  deadline: string
  weight: number
  weight_tier: string
  status: string
  days_overdue: number
  source_meeting_id: string | null
  created_at: string
}

export type ApiTodoListResponse = {
  total: number
  items: ApiCommitment[]
}

export type ApiCommitmentListResponse = {
  total: number
  commitments: ApiCommitment[]
}

export type CreateCommitmentPayload = {
  title: string
  description: string
  ward_id?: number
  assignee?: string
  deadline: string
}

export type TodoActionPayload =
  | { action: 'complete'; note?: string }
  | { action: 'extend'; new_deadline: string; note?: string }

export type ApiWardSummary = {
  id: number
  name: string
  code: string
  population: number | null
  registered_voters: number | null
}

export type ApiWardListResponse = {
  constituency_name: string
  total_population: number
  total_registered_voters: number
  wards: ApiWardSummary[]
}

export type ApiPriorityItem = {
  id: string
  ward_id: number
  ward_name: string
  title: string
  category: string
  source_type: string
  score: number
  rank: number
  reasons: string[]
  citizen_impact: number
  urgency: number
  commitment_pressure: number
  population_factor: number
}

export type ApiWardPrioritySummary = {
  ward_id: number
  ward_name: string
  total_score: number
  open_clusters: number
  open_complaints: number
  overdue_commitments: number
  infra_alerts: number
  population: number | null
  top_action: string | null
}

export type ApiPrioritiesResponse = {
  constituency_name: string
  total: number
  priorities: ApiPriorityItem[]
  ward_comparison: ApiWardPrioritySummary[]
}

export type ApiDigestTotals = {
  complaints_opened: number
  active_commitments: number
  overdue_commitments: number
  completed_commitments: number
  open_clusters: number
  critical_infra_alerts: number
  total_population: number
  total_registered_voters: number
}

export type ApiWardDigestMetrics = {
  ward_id: number
  ward_name: string
  population: number | null
  registered_voters: number | null
  complaints_opened: number
  complaints_by_category: Record<string, number>
  active_commitments: number
  overdue_commitments: number
  completed_commitments: number
  open_clusters: number
  critical_infra_alerts: number
}

export type ApiDigestResponse = {
  constituency_name: string
  period_start: string
  period_end: string
  totals: ApiDigestTotals
  wards: ApiWardDigestMetrics[]
}
