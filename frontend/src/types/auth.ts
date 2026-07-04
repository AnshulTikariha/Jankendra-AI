export type UserRole = 'citizen' | 'staff' | 'leader'

export type AuthSession = {
  userId: string
  accessToken: string
  role: UserRole
  phone: string
  name: string
  constituencyName: string
}

export const roleLabels: Record<UserRole, string> = {
  citizen: 'General Public',
  staff: 'Staff',
  leader: 'Leader',
}
