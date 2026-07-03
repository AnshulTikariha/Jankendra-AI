export type CitizenPageId =
  | 'home'
  | 'raise'
  | 'my-complaints'
  | 'ward-updates'
  | 'help'
  | 'profile'

export type CitizenPage = {
  id: CitizenPageId
  label: string
  description: string
  available: boolean
}

export const citizenPages: CitizenPage[] = [
  {
    id: 'home',
    label: 'Home dashboard',
    description: 'Your complaints overview and community impact.',
    available: true,
  },
  {
    id: 'raise',
    label: 'Report issue',
    description: 'Submit a new issue in your ward.',
    available: true,
  },
  {
    id: 'my-complaints',
    label: 'My complaints',
    description: 'Track status with your reference numbers.',
    available: true,
  },
  {
    id: 'ward-updates',
    label: 'Ward updates',
    description: 'Resolved issues and public updates in your ward.',
    available: false,
  },
  {
    id: 'help',
    label: 'Help & rights',
    description: 'How complaints work and your privacy.',
    available: false,
  },
  {
    id: 'profile',
    label: 'Profile',
    description: 'Your contact details and preferences.',
    available: false,
  },
]
