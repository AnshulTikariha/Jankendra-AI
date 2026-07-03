export type CitizenTransparencyStats = {
  citizenReportsWeek: number
  resolvedInWardWeek: number
  avgResolutionDays: number
}

export const demoCitizenTransparency: CitizenTransparencyStats = {
  citizenReportsWeek: 24,
  resolvedInWardWeek: 18,
  avgResolutionDays: 12,
}

export const citizenTrustPoints = [
  {
    id: 'permanent',
    title: 'Permanent record',
    description: 'Every complaint is logged with a unique reference number.',
  },
  {
    id: 'clustering',
    title: 'Ward clustering',
    description: 'Similar issues in your ward are grouped for faster action.',
  },
  {
    id: 'tracking',
    title: 'Track progress',
    description: 'Follow status updates from submission to resolution.',
  },
] as const

export function getCitizenGreeting(): string {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 17) return 'Good afternoon'
  return 'Good evening'
}
