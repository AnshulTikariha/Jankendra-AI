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
  { id: 'commitments', label: 'Commitment tracker', description: 'Active and resolved commitments from meetings.', available: true },
  { id: 'development-plan', label: 'Development plan', description: 'Ranked ward development actions with reasoning.', available: true, leaderOnly: true },
  { id: 'log-issue', label: 'Log issue', description: 'Citizen complaint intake for accountable records.', available: true, staffOnly: true },
  { id: 'upload-meeting', label: 'Upload meeting', description: 'Transcript upload and processing progress.', available: false, staffOnly: true },
  { id: 'digest', label: 'Weekly digest', description: 'Concise governance digest for the week.', available: true },
  { id: 'chat', label: 'Assistant', description: 'Grounded assistant with streaming responses.', available: false },
  { id: 'profile', label: 'Profile', description: 'User and constituency details.', available: true },
  { id: 'context-injection', label: 'Context library', description: 'Upload trusted context for the knowledge base.', available: false, staffOnly: true },
]
