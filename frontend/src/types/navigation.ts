export type AppPhase =
  | 'Phase 0'
  | 'Phase 1'
  | 'Phase 2'
  | 'Phase 3'
  | 'Phase 4'
  | 'Phase 5'
  | 'Phase 6'

export type NavigationPage = {
  id: string
  label: string
  phase: AppPhase
  description: string
}

export const navigationPages: NavigationPage[] = [
  {
    id: 'dashboard',
    label: 'Home Dashboard',
    phase: 'Phase 1',
    description: 'Live constituency overview and priority signals.',
  },
  {
    id: 'todo',
    label: 'To-Do List',
    phase: 'Phase 2',
    description: 'Weighted action list with complete and extend actions.',
  },
  {
    id: 'commitments',
    label: 'Commitment Tracker',
    phase: 'Phase 3',
    description: 'Active and resolved commitments from meeting transcripts.',
  },
  {
    id: 'development-plan',
    label: 'Development Plan',
    phase: 'Phase 4',
    description: 'AI-ranked ward development actions and reasoning traces.',
  },
  {
    id: 'log-issue',
    label: 'Log Issue',
    phase: 'Phase 2',
    description: 'Complaint intake for immutable issue records.',
  },
  {
    id: 'upload-meeting',
    label: 'Upload Meeting',
    phase: 'Phase 3',
    description: 'Transcript upload and processing job progress.',
  },
  {
    id: 'digest',
    label: 'Digest',
    phase: 'Phase 4',
    description: 'Weekly numbers-only governance digest.',
  },
  {
    id: 'chat',
    label: 'Chat',
    phase: 'Phase 5',
    description: 'Grounded RAG assistant with streaming responses.',
  },
  {
    id: 'profile',
    label: 'Profile',
    phase: 'Phase 1',
    description: 'Leader, staff, and constituency details.',
  },
  {
    id: 'context-injection',
    label: 'Context Injection',
    phase: 'Phase 5',
    description: 'Upload trusted context for the RAG knowledge base.',
  },
]
