export type ApiHotWard = {
  id: string
  name: string
}

export type ApiDashboardKpis = {
  open_complaints: number
  open_complaints_trend: number
  active_commitments: number
  overdue_commitments: number
  resolved_this_week: number
  on_time_rate_pct: number
  citizen_complaints_week: number
  hot_ward: ApiHotWard
}

export type ApiPriorityItem = {
  id: string
  type: string
  title: string
  ward_name: string
  weight: number
  source: string | null
}

export type ApiCommitmentAtRisk = {
  id: string
  title: string
  ward_name: string
  deadline: string
  weight_tier: string
  days_overdue: number
}

export type ApiWardComparisonRow = {
  ward_id: string
  ward_name: string
  open_clusters: number
  open_complaints: number
  overdue_commitments: number
  infra_alerts: string[]
}

export type ApiRecentActivityItem = {
  id: string
  timestamp: string
  type: string
  summary: string
  ward_name: string
}

export type ApiDashboardResponse = {
  constituency_name: string
  kpis: ApiDashboardKpis
  priorities: ApiPriorityItem[]
  commitments_at_risk: ApiCommitmentAtRisk[]
  ward_comparison: ApiWardComparisonRow[]
  recent_activity: ApiRecentActivityItem[]
}
