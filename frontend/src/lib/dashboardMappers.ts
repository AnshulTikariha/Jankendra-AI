import type { ApiDashboardResponse } from '../api/types/dashboard'
import type {
  CommitmentAtRisk,
  DashboardData,
  DashboardKpis,
  PriorityItem,
  RecentActivity,
  WardRow,
} from '../types/dashboard'

function mapPriorityType(type: string): PriorityItem['type'] {
  if (type === 'commitment' || type === 'development') return type
  return 'complaint'
}

function mapActivityType(type: string): RecentActivity['type'] {
  if (
    type === 'citizen_complaint' ||
    type === 'staff_complaint' ||
    type === 'meeting' ||
    type === 'commitment'
  ) {
    return type
  }
  return 'staff_complaint'
}

function mapSource(source: string | null): PriorityItem['source'] | undefined {
  if (source === 'citizen' || source === 'staff') return source
  return undefined
}

function mapKpis(kpis: ApiDashboardResponse['kpis']): DashboardKpis {
  return {
    openComplaints: kpis.open_complaints,
    openComplaintsTrend: kpis.open_complaints_trend,
    activeCommitments: kpis.active_commitments,
    overdueCommitments: kpis.overdue_commitments,
    resolvedThisWeek: kpis.resolved_this_week,
    onTimeRatePct: kpis.on_time_rate_pct,
    citizenComplaintsWeek: kpis.citizen_complaints_week,
    hotWard: {
      id: kpis.hot_ward.id,
      name: kpis.hot_ward.name || '—',
    },
  }
}

export function mapDashboardResponse(response: ApiDashboardResponse): DashboardData {
  return {
    constituencyName: response.constituency_name,
    kpis: mapKpis(response.kpis),
    priorities: response.priorities.map(
      (item): PriorityItem => ({
        id: item.id,
        type: mapPriorityType(item.type),
        title: item.title,
        wardName: item.ward_name,
        weight: item.weight,
        source: mapSource(item.source),
      }),
    ),
    commitmentsAtRisk: response.commitments_at_risk.map(
      (item): CommitmentAtRisk => ({
        id: item.id,
        title: item.title,
        wardName: item.ward_name,
        deadline: item.deadline,
        weightTier: item.weight_tier,
        daysOverdue: item.days_overdue,
      }),
    ),
    wardComparison: response.ward_comparison.map(
      (item): WardRow => ({
        wardId: item.ward_id,
        wardName: item.ward_name,
        openClusters: item.open_clusters,
        openComplaints: item.open_complaints,
        overdueCommitments: item.overdue_commitments,
        infraAlerts: item.infra_alerts,
      }),
    ),
    recentActivity: response.recent_activity.map(
      (item): RecentActivity => ({
        id: item.id,
        timestamp: item.timestamp,
        type: mapActivityType(item.type),
        summary: item.summary,
        wardName: item.ward_name,
      }),
    ),
  }
}
