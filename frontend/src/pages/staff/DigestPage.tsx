import { useMemo } from 'react'
import { ApiError } from '../../api/errors'
import { PageError, PageHeader, PageLoading } from '../../components/staff/PageStates'
import { WardList, type WardListItem } from '../../components/dashboard/WardList'
import { useDigest } from '../../hooks/useStaffApi'

export function DigestPage() {
  const { data, isLoading, isError, error, refetch } = useDigest()

  const wardItems = useMemo<WardListItem[]>(() => {
    const rows = data?.wards ?? []
    const maxComplaints = Math.max(1, ...rows.map((row) => row.complaintsOpened))
    return rows.map((row) => ({
      id: String(row.wardId),
      name: row.wardName,
      subtitle: row.criticalInfraAlerts > 0 ? `${row.criticalInfraAlerts} critical infra alerts` : undefined,
      intensity: Math.round((row.complaintsOpened / maxComplaints) * 100),
      badges: row.overdueCommitments > 0 ? ['Overdue'] : undefined,
      metrics: [
        { key: 'complaintsOpened', label: 'Complaints', value: row.complaintsOpened },
        { key: 'activeCommitments', label: 'Active', value: row.activeCommitments },
        { key: 'overdueCommitments', label: 'Overdue', value: row.overdueCommitments, alert: true },
        { key: 'openClusters', label: 'Clusters', value: row.openClusters },
      ],
    }))
  }, [data?.wards])

  if (isLoading) return <PageLoading message="Loading weekly digest…" />

  if (isError || !data) {
    const message = error instanceof ApiError ? error.message : 'Something went wrong.'
    return <PageError message={message} onRetry={() => void refetch()} />
  }

  const cards = [
    { label: 'Complaints opened', value: data.totals.complaintsOpened },
    { label: 'Active commitments', value: data.totals.activeCommitments },
    { label: 'Overdue commitments', value: data.totals.overdueCommitments },
    { label: 'Completed', value: data.totals.completedCommitments },
    { label: 'Open clusters', value: data.totals.openClusters },
    { label: 'Critical infra alerts', value: data.totals.criticalInfraAlerts },
  ]

  return (
    <section className="space-y-6">
      <PageHeader
        description={`${data.periodStart} → ${data.periodEnd} · ${data.constituencyName}`}
        eyebrow="Weekly digest"
        title="Governance numbers"
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {cards.map((card) => (
          <article className="rounded-2xl border border-line/80 bg-white p-5 shadow-sm" key={card.label}>
            <p className="text-xs font-bold uppercase tracking-wide text-muted">{card.label}</p>
            <p className="mt-2 text-3xl font-extrabold text-ink">{card.value}</p>
          </article>
        ))}
      </div>

      <WardList
        eyebrow="Ward breakdown"
        intensityLabel="Complaints"
        items={wardItems}
        title="Ward activity this week"
      />
    </section>
  )
}
