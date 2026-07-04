import { useAuthStore } from '../../stores/useAuthStore'
import { useUiStore } from '../../stores/useUiStore'
import { useCitizenDashboard } from '../../hooks/useCitizenDashboard'
import { CitizenDashboardHero } from '../../components/citizen/CitizenDashboardHero'
import { CitizenKpiStrip } from '../../components/citizen/CitizenKpiStrip'
import { MyComplaintsPreview } from '../../components/citizen/MyComplaintsPreview'
import { CitizenQuickActions } from '../../components/citizen/CitizenQuickActions'
import { CommunityImpactCard } from '../../components/citizen/CommunityImpactCard'
import { TrustStrip } from '../../components/citizen/TrustStrip'
import type { CitizenView } from '../../stores/useUiStore'

export function CitizenDashboardPage() {
  const session = useAuthStore((s) => s.session)
  const setCitizenView = useUiStore((s) => s.setCitizenView)
  const lastComplaintRef = useUiStore((s) => s.lastComplaintRef)
  const { stats, isLoading } = useCitizenDashboard()

  const navigate = (view: CitizenView) => setCitizenView(view)

  return (
    <section className="space-y-6">
      <CitizenDashboardHero
        constituencyName={session?.constituencyName ?? 'Constituency'}
        onReportIssue={() => navigate('raise')}
        phone={session?.phone}
        stats={stats}
      />

      <CitizenKpiStrip isLoading={isLoading} stats={stats} />

      <div className="grid gap-6 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <MyComplaintsPreview
            complaints={stats.recent}
            isLoading={isLoading}
            onReportIssue={() => navigate('raise')}
            onViewAll={() => navigate('my-complaints')}
          />
        </div>
        <div className="space-y-6">
          <CitizenQuickActions
            lastComplaintRef={lastComplaintRef}
            onNavigate={(view) => navigate(view)}
          />
          <CommunityImpactCard maxClusterCount={stats.maxClusterCount} />
        </div>
      </div>

      <TrustStrip />
    </section>
  )
}
