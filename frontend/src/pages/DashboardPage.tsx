import { useMemo } from 'react'
import { useAuthStore } from '../stores/useAuthStore'
import { useDashboard } from '../hooks/useDashboard'
import { useCities, useWards } from '../hooks/useConstituency'
import { CommitmentsAtRisk } from '../components/dashboard/CommitmentsAtRisk'
import { DashboardHero } from '../components/dashboard/DashboardHero'
import { KpiStrip } from '../components/dashboard/KpiStrip'
import { PriorityList } from '../components/dashboard/PriorityList'
import { QuickActions } from '../components/dashboard/QuickActions'
import { RecentActivityList } from '../components/dashboard/RecentActivityList'
import { IssueHeatMap } from '../components/dashboard/IssueHeatMap'
import { WardComparisonTable } from '../components/dashboard/WardComparisonTable'
import { ApiError } from '../api/errors'
import { filterActiveWardRows, mapWardRowsToMapPoints } from '../lib/wardMapMappers'

function DashboardLoading() {
  return (
    <div className="flex min-h-[20rem] flex-col items-center justify-center rounded-3xl border border-dashed border-slate-300/80 bg-white/80 p-8 text-center shadow-sm">
      <div className="size-10 animate-spin rounded-full border-4 border-primary/20 border-t-primary" />
      <p className="mt-4 text-sm font-semibold text-muted">Loading dashboard…</p>
    </div>
  )
}

function DashboardError({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="flex min-h-[20rem] flex-col items-center justify-center rounded-3xl border border-red-200 bg-red-50/80 p-8 text-center shadow-sm">
      <p className="text-lg font-extrabold text-red-800">Could not load dashboard</p>
      <p className="mt-2 max-w-md text-sm text-red-700">{message}</p>
      <button
        className="mt-4 rounded-full bg-primary px-5 py-2.5 text-sm font-extrabold text-white shadow-md transition hover:bg-primary-dark"
        onClick={onRetry}
        type="button"
      >
        Try again
      </button>
    </div>
  )
}

export function DashboardPage() {
  const session = useAuthStore((s) => s.session)
  const role = session?.role ?? 'staff'
  const isLeader = role === 'leader'
  const isStaff = role === 'staff'
  const { data, isLoading, isError, error, refetch } = useDashboard()
  const { data: wardGeo } = useWards()
  const { data: cityOptions } = useCities()
  const mapWards = useMemo(() => {
    if (!data) return undefined
    const activeRows = filterActiveWardRows(data.wardComparison)
    if (activeRows.length === 0) return []
    return mapWardRowsToMapPoints(activeRows, wardGeo?.wards)
  }, [data, wardGeo?.wards])

  const mapLabel = useMemo(() => {
    if (!mapWards?.length || !wardGeo?.wards) {
      return 'India · Active wards'
    }

    const activeIds = new Set(mapWards.map((ward) => ward.wardId))
    const activeCities = [
      ...new Set(
        wardGeo.wards
          .filter((ward) => activeIds.has(String(ward.id)))
          .map((ward) => ward.city)
          .filter((city): city is string => Boolean(city)),
      ),
    ]

    if (activeCities.length === 0) return data?.constituencyName ?? 'Active wards'
    if (activeCities.length === 1) {
      const city = activeCities[0]
      return cityOptions?.find((option) => option.city === city)?.displayName ?? city
    }

    return activeCities
      .map((city) => cityOptions?.find((option) => option.city === city)?.displayName ?? city)
      .join(' · ')
  }, [data?.constituencyName, mapWards, wardGeo?.wards, cityOptions])

  if (role === 'citizen') return null

  if (isLoading) {
    return (
      <section className="space-y-6">
        <DashboardHero
          constituencyName={session?.constituencyName ?? 'Constituency'}
          phone={session?.phone}
          role={role}
        />
        <DashboardLoading />
      </section>
    )
  }

  if (isError || !data) {
    const message =
      error instanceof ApiError ? error.message : 'Something went wrong. Please try again.'
    return (
      <section className="space-y-6">
        <DashboardHero
          constituencyName={session?.constituencyName ?? 'Constituency'}
          phone={session?.phone}
          role={role}
        />
        <DashboardError message={message} onRetry={() => void refetch()} />
      </section>
    )
  }

  return (
    <section className="space-y-6">
      <DashboardHero
        constituencyName={data.constituencyName}
        phone={session?.phone}
        role={role}
      />

      <KpiStrip kpis={data.kpis} showCitizenMetric />

      <IssueHeatMap mapLabel={mapLabel} wards={mapWards} />

      <div className="grid gap-6 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <PriorityList
            actionable={isStaff}
            items={data.priorities}
            role={role}
            title={isStaff ? 'Your queue today' : "Today's focus"}
          />
        </div>
        <div className="space-y-6">
          {isLeader && <CommitmentsAtRisk items={data.commitmentsAtRisk} />}
          <QuickActions role={role} />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {isLeader && <WardComparisonTable rows={data.wardComparison} />}
        <RecentActivityList items={data.recentActivity} role={role} />
      </div>
    </section>
  )
}
