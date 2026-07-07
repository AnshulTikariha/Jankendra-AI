export type ApiWeeklyBriefing = {
  constituency_name: string
  period_start: string
  period_end: string
  headline: string
  summary: string
  highlights: string[]
  risks: string[]
  recommendations: string[]
}

export type ApiPriorityInsightItem = {
  id: string
  explanation: string
  recommended_action: string
}

export type ApiPriorityInsightsResponse = {
  overview: string
  items: ApiPriorityInsightItem[]
}

export type ApiComplaintTheme = {
  theme: string
  category: string
  count: number
  summary: string
  severity: string
  wards: string[]
}

export type ApiComplaintThemesResponse = {
  overview: string
  period_label: string
  total_complaints: number
  themes: ApiComplaintTheme[]
}
