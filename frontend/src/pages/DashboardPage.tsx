import { useAuthStore } from '../stores/useAuthStore'
import {
  demoCommitmentsAtRisk,
  demoKpis,
  demoPriorityItems,
  demoRecentActivity,
  demoWardComparison,
  getDashboardGreeting,
} from '../data/demoDashboard'
import { roleLabels } from '../types/auth'
import { CommitmentsAtRisk } from '../components/dashboard/CommitmentsAtRisk'
import { KpiStrip } from '../components/dashboard/KpiStrip'
import { PriorityList } from '../components/dashboard/PriorityList'
import { QuickActions } from '../components/dashboard/QuickActions'
import { RecentActivityList } from '../components/dashboard/RecentActivityList'
import { WardComparisonTable } from '../components/dashboard/WardComparisonTable'

export function DashboardPage() {
  const session = useAuthStore((s) => s.session)
  const role = session?.role ?? 'staff'
  const isLeader = role === 'leader'
  const isStaff = role === 'staff'

  if (role === 'citizen') return null

  return (
    <section className="space-y-6">
      <div className="rounded-3xl border border-line bg-white p-6 shadow-sm">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-accent">
          {getDashboardGreeting(role)}
        </p>
        <h1 className="mt-2 text-3xl font-extrabold tracking-tight">
          {session?.constituencyName ?? 'Constituency'}
        </h1>
        <p className="mt-2 text-sm text-muted">
          Signed in as <span className="font-bold text-ink">{roleLabels[role]}</span>
          {session?.phone ? ` · +91 ${session.phone}` : ''}
        </p>
      </div>

      <KpiStrip kpis={demoKpis} showCitizenMetric />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <PriorityList
            actionable={isStaff}
            items={demoPriorityItems}
            title={isStaff ? 'Your queue today' : "Today's focus"}
          />
        </div>
        <div className="space-y-6">
          {isLeader && <CommitmentsAtRisk items={demoCommitmentsAtRisk} />}
          <QuickActions role={role} />
        </div>
      </div>

      {isLeader && <WardComparisonTable rows={demoWardComparison} />}
      {isStaff && <RecentActivityList items={demoRecentActivity} />}
      {isLeader && <RecentActivityList items={demoRecentActivity} />}
    </section>
  )
}
