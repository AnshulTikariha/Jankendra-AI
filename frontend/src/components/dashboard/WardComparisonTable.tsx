import { useMemo } from 'react'
import type { WardRow } from '../../types/dashboard'
import { WardList, type WardListItem } from './WardList'

type Props = {
  rows: WardRow[]
}

export function WardComparisonTable({ rows }: Props) {
  const maxClusters = useMemo(() => Math.max(1, ...rows.map((row) => row.openClusters)), [rows])

  const items = useMemo<WardListItem[]>(
    () =>
      rows.map((row) => ({
        id: row.wardId,
        name: row.wardName,
        subtitle: row.infraAlerts.length > 0 ? `Alerts: ${row.infraAlerts.join(', ')}` : undefined,
        intensity: Math.round((row.openClusters / maxClusters) * 100),
        badges: row.overdueCommitments > 0 ? ['Overdue'] : undefined,
        metrics: [
          { key: 'openClusters', label: 'Clusters', value: row.openClusters },
          { key: 'openComplaints', label: 'Complaints', value: row.openComplaints },
          { key: 'overdueCommitments', label: 'Overdue', value: row.overdueCommitments, alert: true },
        ],
      })),
    [rows, maxClusters],
  )

  return <WardList eyebrow="Constituency map" intensityLabel="Clusters" items={items} title="Ward comparison" />
}
