type Props = {
  lastComplaintRef: string | null
  onNavigate: (view: 'raise' | 'my-complaints' | 'ward-updates') => void
}

const actions = [
  {
    id: 'raise' as const,
    label: 'Report new issue',
    desc: 'Submit a ward complaint',
    gradient: 'from-rose-500 to-pink-600',
    icon: '＋',
  },
  {
    id: 'my-complaints' as const,
    label: 'Track complaints',
    desc: 'View all your submissions',
    gradient: 'from-blue-500 to-indigo-600',
    icon: '☰',
  },
  {
    id: 'ward-updates' as const,
    label: 'Ward updates',
    desc: 'Public resolution feed',
    gradient: 'from-amber-500 to-orange-500',
    icon: '▤',
    soon: true,
  },
]

export function CitizenQuickActions({ lastComplaintRef, onNavigate }: Props) {
  const handleCopyRef = async () => {
    if (!lastComplaintRef) return
    try {
      await navigator.clipboard.writeText(lastComplaintRef)
    } catch {
      // clipboard may be unavailable
    }
  }

  return (
    <section className="overflow-hidden rounded-3xl border border-line/80 bg-white shadow-md shadow-slate-200/50">
      <div className="border-b border-line/80 bg-gradient-to-r from-teal-50/50 to-white px-5 py-4">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-accent">Shortcuts</p>
        <h2 className="mt-1 text-lg font-extrabold">Quick actions</h2>
      </div>
      <div className="grid gap-2 p-4">
        {actions.map((action) => (
          <button
            className="group flex items-center gap-4 rounded-2xl border border-line/80 bg-white p-3 text-left transition hover:-translate-y-0.5 hover:border-transparent hover:shadow-lg"
            key={action.id}
            onClick={() => onNavigate(action.id)}
            type="button"
          >
            <div className={`grid size-11 shrink-0 place-items-center rounded-2xl bg-gradient-to-br ${action.gradient} text-lg font-bold text-white shadow-md transition group-hover:scale-105`}>
              {action.icon}
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-bold text-ink">{action.label}</p>
              <p className="text-xs text-muted">{action.desc}</p>
            </div>
            {action.soon ? (
              <span className="shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-[0.6rem] font-bold uppercase text-slate-500">
                Soon
              </span>
            ) : (
              <span className="ml-auto text-lg text-slate-300 transition group-hover:text-teal-600">→</span>
            )}
          </button>
        ))}

        {lastComplaintRef && (
          <button
            className="flex items-center gap-3 rounded-2xl border border-dashed border-teal-200 bg-teal-50/50 p-3 text-left transition hover:bg-teal-50"
            onClick={handleCopyRef}
            type="button"
          >
            <div className="grid size-9 place-items-center rounded-xl bg-white text-xs font-bold text-teal-700 shadow-sm">
              #
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-muted">Last reference</p>
              <p className="font-mono text-sm font-extrabold text-teal-800">{lastComplaintRef}</p>
            </div>
            <span className="ml-auto text-xs font-bold text-teal-600">Copy</span>
          </button>
        )}
      </div>
    </section>
  )
}
