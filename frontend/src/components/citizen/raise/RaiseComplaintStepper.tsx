import { useTranslation } from 'react-i18next'
import { raiseComplaintSteps, type RaiseComplaintStep } from '../../../types/raiseComplaint'

type Props = {
  current: RaiseComplaintStep
}

export function RaiseComplaintStepper({ current }: Props) {
  const { t } = useTranslation('complaints')
  const currentIndex = raiseComplaintSteps.indexOf(current)

  return (
    <div className="space-y-3">
      <p className="text-xs font-bold uppercase tracking-[0.16em] text-muted">
        {t('raise.stepOf', { current: currentIndex + 1, total: raiseComplaintSteps.length })}
      </p>
      <div className="flex gap-2">
        {raiseComplaintSteps.map((step, index) => {
          const done = index < currentIndex
          const active = index === currentIndex
          return (
            <div className="flex min-w-0 flex-1 flex-col gap-1" key={step}>
              <div
                className={`h-1.5 rounded-full ${
                  done || active ? 'bg-teal-500' : 'bg-slate-200'
                }`}
              />
              <span
                className={`truncate text-[0.65rem] font-bold ${
                  active ? 'text-teal-700' : done ? 'text-teal-600' : 'text-muted'
                }`}
              >
                {t(`raise.steps.${step}`)}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
