import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  createCommitment,
  createStaffComplaint,
  fetchCommitments,
  fetchDigest,
  fetchPriorities,
  fetchTodo,
  patchTodoItem,
} from '../api/staff'
import type { CreateCommitmentPayload, TodoActionPayload } from '../api/types/staff'
import type { CreateComplaintPayload } from '../api/types/complaints'
import { mapCommitment, type DevelopmentPriority, type WardPrioritySummary } from '../types/staff'
import { useAuthStore } from '../stores/useAuthStore'

export { useWardBoundaries, useWards } from './useConstituency'

export function useTodoList() {
  const token = useAuthStore((s) => s.session?.accessToken)

  return useQuery({
    queryKey: ['todo'],
    queryFn: async () => {
      if (!token) throw new Error('Not authenticated')
      const response = await fetchTodo(token)
      return {
        total: response.total,
        items: response.items.map(mapCommitment),
      }
    },
    enabled: Boolean(token),
  })
}

export function useTodoAction() {
  const token = useAuthStore((s) => s.session?.accessToken)
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      id,
      payload,
    }: {
      id: string
      payload: TodoActionPayload
    }) => {
      if (!token) throw new Error('Not authenticated')
      return patchTodoItem(token, id, payload)
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['todo'] })
      void queryClient.invalidateQueries({ queryKey: ['commitments'] })
      void queryClient.invalidateQueries({ queryKey: ['dashboard'] })
    },
  })
}

export function useCommitments(status: 'all' | 'active' | 'completed' = 'all') {
  const token = useAuthStore((s) => s.session?.accessToken)

  return useQuery({
    queryKey: ['commitments', status],
    queryFn: async () => {
      if (!token) throw new Error('Not authenticated')
      const response = await fetchCommitments(token, status)
      return {
        total: response.total,
        commitments: response.commitments.map(mapCommitment),
      }
    },
    enabled: Boolean(token),
  })
}

export function useCreateCommitment() {
  const token = useAuthStore((s) => s.session?.accessToken)
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (payload: CreateCommitmentPayload) => {
      if (!token) throw new Error('Not authenticated')
      const response = await createCommitment(token, payload)
      return mapCommitment(response)
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['commitments'] })
      void queryClient.invalidateQueries({ queryKey: ['todo'] })
      void queryClient.invalidateQueries({ queryKey: ['dashboard'] })
    },
  })
}

export function usePriorities(wardId?: number) {
  const token = useAuthStore((s) => s.session?.accessToken)

  return useQuery({
    queryKey: ['priorities', wardId ?? 'all'],
    queryFn: async () => {
      if (!token) throw new Error('Not authenticated')
      const response = await fetchPriorities(token, wardId)
      const priorities: DevelopmentPriority[] = response.priorities.map((item) => ({
        id: item.id,
        wardId: item.ward_id,
        wardName: item.ward_name,
        title: item.title,
        category: item.category,
        sourceType: item.source_type,
        score: item.score,
        rank: item.rank,
        reasons: item.reasons,
        citizenImpact: item.citizen_impact,
        urgency: item.urgency,
        commitmentPressure: item.commitment_pressure,
        populationFactor: item.population_factor,
      }))
      const wardComparison: WardPrioritySummary[] = response.ward_comparison.map((item) => ({
        wardId: item.ward_id,
        wardName: item.ward_name,
        totalScore: item.total_score,
        openClusters: item.open_clusters,
        openComplaints: item.open_complaints,
        overdueCommitments: item.overdue_commitments,
        infraAlerts: item.infra_alerts,
        population: item.population,
        topAction: item.top_action,
      }))
      return {
        constituencyName: response.constituency_name,
        total: response.total,
        priorities,
        wardComparison,
      }
    },
    enabled: Boolean(token),
  })
}

export function useDigest() {
  const token = useAuthStore((s) => s.session?.accessToken)

  return useQuery({
    queryKey: ['digest'],
    queryFn: async () => {
      if (!token) throw new Error('Not authenticated')
      const response = await fetchDigest(token)
      return {
        constituencyName: response.constituency_name,
        periodStart: response.period_start,
        periodEnd: response.period_end,
        totals: {
          complaintsOpened: response.totals.complaints_opened,
          activeCommitments: response.totals.active_commitments,
          overdueCommitments: response.totals.overdue_commitments,
          completedCommitments: response.totals.completed_commitments,
          openClusters: response.totals.open_clusters,
          criticalInfraAlerts: response.totals.critical_infra_alerts,
          totalPopulation: response.totals.total_population,
          totalRegisteredVoters: response.totals.total_registered_voters,
        },
        wards: response.wards.map((w) => ({
          wardId: w.ward_id,
          wardName: w.ward_name,
          population: w.population,
          registeredVoters: w.registered_voters,
          complaintsOpened: w.complaints_opened,
          complaintsByCategory: w.complaints_by_category,
          activeCommitments: w.active_commitments,
          overdueCommitments: w.overdue_commitments,
          completedCommitments: w.completed_commitments,
          openClusters: w.open_clusters,
          criticalInfraAlerts: w.critical_infra_alerts,
        })),
      }
    },
    enabled: Boolean(token),
  })
}

export function useStaffCreateComplaint() {
  const token = useAuthStore((s) => s.session?.accessToken)
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (
      payload: CreateComplaintPayload & { citizen_contact?: string },
    ) => {
      if (!token) throw new Error('Not authenticated')
      return createStaffComplaint(token, payload)
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['complaints'] })
      void queryClient.invalidateQueries({ queryKey: ['dashboard'] })
    },
  })
}
