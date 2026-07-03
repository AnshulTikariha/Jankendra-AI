import { useAuthStore } from '../stores/useAuthStore'
import {
  demoCommitmentsAtRisk,
  demoKpis,
  demoPriorityItems,
  demoRecentActivity,
  demoWardComparison,
} from '../data/demoDashboard'
import { CommitmentsAtRisk } from '../components/dashboard/CommitmentsAtRisk'
import { DashboardHero } from '../components/dashboard/DashboardHero'
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
      <DashboardHero
        constituencyName={session?.constituencyName ?? 'Constituency'}
        phone={session?.phone}
        role={role}
      />

      <KpiStrip kpis={demoKpis} showCitizenMetric />

      <div className="grid gap-6 xl:grid-cols-3">
        <div className="xl:col-span-2">
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

      <div className="grid gap-6 lg:grid-cols-2">
        {isLeader && <WardComparisonTable rows={demoWardComparison} />}
        <RecentActivityList items={demoRecentActivity} />
      </div>
    </section>
  )
}
