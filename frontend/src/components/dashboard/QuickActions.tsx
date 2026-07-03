type Props = {
  role: 'staff' | 'leader'
}

export function QuickActions({ role }: Props) {
  const staffActions = [
    { label: 'Log issue', desc: 'Record a citizen complaint' },
    { label: 'Upload meeting', desc: 'Submit a transcript' },
    { label: 'Update ward data', desc: 'Edit constituency records' },
  ]

  const leaderActions = [
    { label: 'Development plan', desc: 'Ranked ward actions' },
    { label: 'Weekly digest', desc: 'Governance numbers' },
    { label: 'Ask assistant', desc: 'Grounded answers' },
  ]

  const actions = role === 'staff' ? staffActions : leaderActions

  return (
    <section className="rounded-2xl border border-line bg-white p-5 shadow-sm">
      <h2 className="text-lg font-extrabold">{role === 'staff' ? 'Quick actions' : 'Strategic links'}</h2>
      <div className="mt-4 grid gap-2">
        {actions.map((action) => (
          <button
            className="rounded-xl border border-line px-4 py-3 text-left transition hover:border-primary-light hover:bg-soft-blue/40"
            key={action.label}
            type="button"
          >
            <p className="font-bold">{action.label}</p>
            <p className="text-xs text-muted">{action.desc}</p>
          </button>
        ))}
      </div>
    </section>
  )
}
