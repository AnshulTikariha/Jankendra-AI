import { useTranslation } from 'react-i18next'

type Props = {
  value: string
  onChange: (value: string) => void
}

export function CustomCategoryField({ value, onChange }: Props) {
  const { t } = useTranslation('complaints')

  return (
    <label className="block rounded-2xl border border-amber-200 bg-amber-50/60 p-4">
      <span className="text-sm font-bold text-amber-950">{t('raise.what.customCategory')}</span>
      <p className="mt-0.5 text-xs text-amber-900/80">{t('raise.what.customCategoryHint')}</p>
      <input
        className="mt-2 w-full rounded-xl border border-amber-200 bg-white px-4 py-3 font-medium outline-none focus:ring-4 focus:ring-amber-200/40"
        maxLength={80}
        onChange={(e) => onChange(e.target.value)}
        placeholder={t('raise.what.customCategoryPlaceholder')}
        type="text"
        value={value}
      />
    </label>
  )
}
