import { useUiStore } from '../../stores/useUiStore'
import { getRoleTheme } from '../../theme/roleThemes'

type Props = {
  role: 'staff' | 'leader'
}

const staffActions = [
  { label: 'Complaint queue', desc: 'All complaints & filters', pageId: 'complaints-queue', gradient: 'from-blue-500 to-cyan-500', icon: '☰' },
  { label: 'Log issue', desc: 'Record a citizen complaint', pageId: 'log-issue', gradient: 'from-rose-500 to-pink-600', icon: '＋' },
  { label: 'To-do list', desc: 'Complete or extend items', pageId: 'todo', gradient: 'from-emerald-500 to-teal-600', icon: '✓' },
]

const leaderActions = [
  { label: 'Complaint queue', desc: 'All complaints & filters', pageId: 'complaints-queue', gradient: 'from-blue-500 to-cyan-500', icon: '☰' },
  { label: 'Development plan', desc: 'Ranked ward actions', pageId: 'development-plan', gradient: 'from-violet-500 to-purple-500', icon: '◆' },
  { label: 'Weekly digest', desc: 'Governance numbers', pageId: 'digest', gradient: 'from-purple-400 to-indigo-500', icon: '▤' },
]

export function QuickActions({ role }: Props) {
  const setActivePageId = useUiStore((s) => s.setActivePageId)
  const actions = role === 'staff' ? staffActions : leaderActions
  const theme = getRoleTheme(role)

  return (
    <section className="overflow-hidden rounded-3xl border border-line/80 bg-white shadow-md shadow-slate-200/50">
      <div className={`border-b border-line/80 bg-gradient-to-r ${theme.sectionHeaderBg} px-5 py-4`}>
        <p className={`text-xs font-bold uppercase tracking-[0.16em] ${theme.sectionEyebrow}`}>Shortcuts</p>
        <h2 className="mt-1 text-lg font-extrabold">{role === 'staff' ? 'Quick actions' : 'Strategic links'}</h2>
      </div>
      <div className="grid gap-2 p-4">
        {actions.map((action) => (
          <button
            className="group flex items-center gap-4 rounded-2xl border border-line/80 bg-white p-3 text-left transition hover:-translate-y-0.5 hover:border-transparent hover:shadow-lg"
            key={action.label}
            onClick={() => setActivePageId(action.pageId)}
            type="button"
          >
            <div className={`grid size-11 shrink-0 place-items-center rounded-2xl bg-gradient-to-br ${action.gradient} text-lg font-bold text-white shadow-md transition group-hover:scale-105`}>
              {action.icon}
            </div>
            <div className="min-w-0">
              <p className="font-bold text-ink">{action.label}</p>
              <p className="text-xs text-muted">{action.desc}</p>
            </div>
            <span className="ml-auto text-lg text-slate-300 transition group-hover:translate-x-0.5">→</span>
          </button>
        ))}
      </div>
    </section>
  )
}
