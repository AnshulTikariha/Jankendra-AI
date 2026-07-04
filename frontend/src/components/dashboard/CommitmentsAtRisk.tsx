import type { CommitmentAtRisk } from '../../types/dashboard'
import { getRoleTheme } from '../../theme/roleThemes'

type Props = {
  items: CommitmentAtRisk[]
}

export function CommitmentsAtRisk({ items }: Props) {
  const theme = getRoleTheme('leader')

  return (
    <section className={`overflow-hidden rounded-3xl border ${theme.alertSectionBorder} bg-gradient-to-b ${theme.alertSectionBg} shadow-md shadow-violet-100/50`}>
      <div className="border-b border-violet-100 px-5 py-4">
        <div className="flex items-center gap-3">
          <div className={`grid size-10 place-items-center rounded-2xl bg-gradient-to-br ${theme.alertIcon} text-white shadow-lg`}>
            <svg aria-hidden="true" className="size-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M12 8v4m0 4h.01M5.07 19h13.86c1.54 0 2.5-1.67 1.73-3L13.73 5c-.77-1.33-2.69-1.33-3.46 0L3.34 16c-.77 1.33.19 3 1.73 3z" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <div>
            <p className={`text-xs font-bold uppercase tracking-[0.16em] ${theme.alertEyebrow}`}>Accountability</p>
            <h2 className="text-lg font-extrabold text-ink">Commitments at risk</h2>
          </div>
        </div>
      </div>

      <ul className="space-y-3 p-4">
        {items.map((item) => (
          <li className="rounded-2xl border border-violet-100 bg-white/80 p-4 shadow-sm" key={item.id}>
            <div className="flex items-center justify-between gap-2">
              <span className={`rounded-full px-2.5 py-1 text-xs font-extrabold ${theme.badgeSoft}`}>
                {item.weightTier}
              </span>
              <span className={`text-xs font-bold ${theme.sectionEyebrow}`}>{item.daysOverdue}d overdue</span>
            </div>
            <p className="mt-2 font-bold leading-snug">{item.title}</p>
            <p className="mt-1 text-xs text-muted">{item.wardName} · due {item.deadline}</p>
          </li>
        ))}
      </ul>
    </section>
  )
}
