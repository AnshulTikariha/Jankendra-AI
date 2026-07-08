import type { UserRole } from '../types/auth'

export type WorkspaceMobileNavItem = {
  id: string
  label: string
  icon: string
  menuTrigger?: boolean
}

export function getWorkspaceMobileNavItems(role: UserRole): WorkspaceMobileNavItem[] {
  if (role === 'leader') {
    return [
      { id: 'dashboard', label: 'Home', icon: '⌂' },
      { id: 'complaint-insights', label: 'Insights', icon: '✦' },
      { id: 'development-plan', label: 'Plan', icon: '▤' },
      { id: 'complaints-queue', label: 'Queue', icon: '☰' },
      { id: '__menu__', label: 'More', icon: '⋯', menuTrigger: true },
    ]
  }

  return [
    { id: 'dashboard', label: 'Home', icon: '⌂' },
    { id: 'complaints-queue', label: 'Queue', icon: '☰' },
    { id: 'todo', label: 'To-do', icon: '✓' },
    { id: 'log-issue', label: 'Log', icon: '＋' },
    { id: '__menu__', label: 'More', icon: '⋯', menuTrigger: true },
  ]
}
