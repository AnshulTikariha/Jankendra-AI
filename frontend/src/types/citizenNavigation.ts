export type CitizenPageId =
  | 'home'
  | 'raise'
  | 'my-complaints'
  | 'ward-updates'
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
    description: 'Browse nearby ward complaints in read-only mode.',
    available: true,
  },
  {
    id: 'profile',
    label: 'Profile',
    description: 'Your contact details and preferences.',
    available: true,
  },
]
