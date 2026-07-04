import { useQuery } from '@tanstack/react-query'
import { fetchDashboard } from '../api/dashboard'
import { mapDashboardResponse } from '../lib/dashboardMappers'
import { useAuthStore } from '../stores/useAuthStore'

export function useDashboard() {
  const token = useAuthStore((s) => s.session?.accessToken)

  return useQuery({
    queryKey: ['dashboard'],
    queryFn: async () => {
      if (!token) throw new Error('Not authenticated')
      const response = await fetchDashboard(token)
      return mapDashboardResponse(response)
    },
    enabled: Boolean(token),
  })
}
