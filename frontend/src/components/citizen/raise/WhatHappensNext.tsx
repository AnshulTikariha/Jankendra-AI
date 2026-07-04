import { useTranslation } from 'react-i18next'

export function WhatHappensNext() {
  const { t } = useTranslation('complaints')
  const steps = [t('raise.whatHappensNext.step1'), t('raise.whatHappensNext.step2'), t('raise.whatHappensNext.step3')]

  return (
    <details className="group rounded-2xl border border-teal-100 bg-teal-50/60">
      <summary className="cursor-pointer list-none px-4 py-3 text-sm font-bold text-teal-900 marker:content-none [&::-webkit-details-marker]:hidden">
        <span className="flex items-center justify-between gap-2">
          {t('raise.whatHappensNext.title')}
          <span className="text-teal-600 transition group-open:rotate-180">▾</span>
        </span>
      </summary>
      <ol className="space-y-2 border-t border-teal-100 px-4 py-3 text-sm text-teal-900/90">
        {steps.map((step, index) => (
          <li className="flex gap-3" key={step}>
            <span className="grid size-6 shrink-0 place-items-center rounded-full bg-teal-600 text-xs font-extrabold text-white">
              {index + 1}
            </span>
            <span className="pt-0.5">{step}</span>
          </li>
        ))}
      </ol>
    </details>
  )
}
