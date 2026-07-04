import { useTranslation } from 'react-i18next'
import type { ComplaintPriority } from '../../../types/raiseComplaint'

const priorityOptions: ComplaintPriority[] = ['low', 'medium', 'high', 'critical']

const priorityStyles: Record<ComplaintPriority, string> = {
  low: 'border-slate-300 bg-slate-50 text-slate-700',
  medium: 'border-blue-300 bg-blue-50 text-blue-800',
  high: 'border-amber-300 bg-amber-50 text-amber-900',
  critical: 'border-rose-400 bg-rose-50 text-rose-900',
}

const priorityActiveStyles: Record<ComplaintPriority, string> = {
  low: 'border-slate-500 ring-2 ring-slate-200',
  medium: 'border-blue-500 ring-2 ring-blue-200',
  high: 'border-amber-500 ring-2 ring-amber-200',
  critical: 'border-rose-500 ring-2 ring-rose-200',
}

type Props = {
  value: ComplaintPriority
  onChange: (priority: ComplaintPriority) => void
}

export function PriorityPicker({ value, onChange }: Props) {
  const { t } = useTranslation('complaints')

  return (
    <fieldset>
      <legend className="text-sm font-bold">{t('raise.details.priority')}</legend>
      <p className="mt-0.5 text-xs text-muted">{t('raise.details.priorityHint')}</p>
      <div className="mt-2 flex flex-wrap gap-2">
        {priorityOptions.map((option) => {
          const selected = value === option
          return (
            <button
              className={`rounded-full border px-3 py-1.5 text-xs font-bold transition ${
                selected
                  ? priorityActiveStyles[option]
                  : priorityStyles[option]
              }`}
              key={option}
              onClick={() => onChange(option)}
              type="button"
            >
              {t(`raise.details.priorityOptions.${option}`)}
            </button>
          )
        })}
      </div>
    </fieldset>
  )
}
