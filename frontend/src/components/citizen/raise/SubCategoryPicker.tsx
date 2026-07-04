import { useTranslation } from 'react-i18next'
import { subCategoriesByCategory } from '../../../data/complaintSubCategories'
import type { ComplaintCategory } from '../../../types/complaint'

type Props = {
  category: ComplaintCategory
  value: string
  onChange: (subCategory: string) => void
}

export function SubCategoryPicker({ category, value, onChange }: Props) {
  const { t } = useTranslation('complaints')
  const options = subCategoriesByCategory[category]

  if (category === 'other') return null

  return (
    <fieldset>
      <legend className="text-sm font-bold">{t('raise.what.subCategory')}</legend>
      <p className="mt-0.5 text-xs text-muted">{t('raise.what.subCategoryHint')}</p>
      <div className="mt-2 flex flex-wrap gap-2">
        {options.map((option) => (
          <button
            className={`rounded-full border px-3 py-1.5 text-xs font-bold transition ${
              value === option
                ? 'border-teal-500 bg-teal-50 text-teal-800'
                : 'border-line bg-white text-muted hover:border-teal-200'
            }`}
            key={option}
            onClick={() => onChange(value === option ? '' : option)}
            type="button"
          >
            {t(`raise.subCategories.${category}.${option}`)}
          </button>
        ))}
      </div>
    </fieldset>
  )
}

export function getSubCategoryLabel(
  category: ComplaintCategory,
  subCategory: string,
  t: (key: string) => string,
): string | undefined {
  if (!subCategory || category === 'other') return undefined
  return t(`raise.subCategories.${category}.${subCategory}`)
}
