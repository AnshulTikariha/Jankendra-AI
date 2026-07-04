import { useTranslation } from 'react-i18next'
import type { ComplaintCategory } from '../../../types/complaint'

const categories: ComplaintCategory[] = [
  'water',
  'roads',
  'drainage',
  'electricity',
  'health',
  'sanitation',
  'other',
]

const categoryIcons: Record<ComplaintCategory, string> = {
  water: '💧',
  roads: '🛣️',
  drainage: '🌊',
  electricity: '⚡',
  health: '🏥',
  sanitation: '🗑️',
  other: '📋',
}

type Props = {
  value: ComplaintCategory
  onChange: (category: ComplaintCategory) => void
}

export function CategoryCardGrid({ value, onChange }: Props) {
  const { t } = useTranslation('complaints')

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {categories.map((cat) => {
        const selected = value === cat
        return (
          <button
            className={`rounded-2xl border p-4 text-left transition hover:shadow-md ${
              selected
                ? 'border-teal-500 bg-teal-50 ring-2 ring-teal-200'
                : 'border-line/80 bg-white hover:border-teal-200'
            }`}
            key={cat}
            onClick={() => onChange(cat)}
            type="button"
          >
            <div className="flex items-start gap-3">
              <span aria-hidden="true" className="text-2xl">{categoryIcons[cat]}</span>
              <div className="min-w-0">
                <p className="font-extrabold text-ink">{t(`raise.categories.${cat}`)}</p>
                <p className="mt-1 text-xs text-muted">{t(`raise.what.examples.${cat}`)}</p>
              </div>
            </div>
          </button>
        )
      })}
    </div>
  )
}
