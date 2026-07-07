export type NavigationPage = {
  id: string
  label: string
  description: string
  available: boolean
  staffOnly?: boolean
  leaderOnly?: boolean
}

export const navigationPages: NavigationPage[] = [
  { id: 'dashboard', label: 'Home dashboard', description: 'Live constituency overview and priority signals.', available: true },
  { id: 'todo', label: 'To-do list', description: 'Weighted action list with complete and extend actions.', available: true },
  { id: 'complaints-queue', label: 'Complaint queue', description: 'All complaints with filters and status actions.', available: true },
  { id: 'commitments', label: 'Commitment tracker', description: 'Active and resolved commitments from meetings.', available: true },
  { id: 'development-plan', label: 'Development plan', description: 'Ranked ward development actions with reasoning.', available: true, leaderOnly: true },
  { id: 'log-issue', label: 'Log issue', description: 'Citizen complaint intake for accountable records.', available: true, staffOnly: true },
  { id: 'digest', label: 'Weekly digest', description: 'Concise governance digest for the week.', available: true },
  { id: 'profile', label: 'Profile', description: 'User and constituency details.', available: true },
]
