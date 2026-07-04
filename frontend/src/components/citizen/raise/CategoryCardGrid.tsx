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
  value: ComplaintCategory[]
  onChange: (categories: ComplaintCategory[]) => void
}

export function CategoryCardGrid({ value, onChange }: Props) {
  const { t } = useTranslation('complaints')

  const toggleCategory = (category: ComplaintCategory) => {
    const selected = value.includes(category)
    if (selected) {
      if (value.length === 1) return
      onChange(value.filter((item) => item !== category))
      return
    }
    onChange([...value, category])
  }

  return (
    <div className="space-y-3">
      <p className="text-xs font-semibold text-muted">{t('raise.what.multiSelectHint')}</p>
      <div className="grid gap-3 sm:grid-cols-2">
        {categories.map((cat) => {
          const selected = value.includes(cat)
          return (
            <button
              aria-pressed={selected}
              className={`rounded-2xl border p-4 text-left transition hover:shadow-md ${
                selected
                  ? 'border-teal-500 bg-teal-50 ring-2 ring-teal-200'
                  : 'border-line/80 bg-white hover:border-teal-200'
              }`}
              key={cat}
              onClick={() => toggleCategory(cat)}
              type="button"
            >
              <div className="flex items-start gap-3">
                <span aria-hidden="true" className="text-2xl">{categoryIcons[cat]}</span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-extrabold text-ink">{t(`raise.categories.${cat}`)}</p>
                    {selected && (
                      <span className="rounded-full bg-teal-600 px-2 py-0.5 text-[0.65rem] font-bold text-white">
                        ✓
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-xs text-muted">{t(`raise.what.examples.${cat}`)}</p>
                </div>
              </div>
            </button>
          )
        })}
      </div>
      {value.length > 0 && (
        <p className="text-xs font-semibold text-teal-800">
          {t('raise.what.selectedCount', { count: value.length })}
        </p>
      )}
    </div>
  )
}
