import { useTranslation } from 'react-i18next'
import type { ComplaintCategory } from '../../../types/complaint'

type Props = {
  count: number
  clusterCount: number
  category: ComplaintCategory
}

export function SimilarComplaintsBanner({ count, clusterCount, category }: Props) {
  const { t } = useTranslation('complaints')

  if (count === 0) return null

  const categoryLabel = t(`raise.categories.${category}`)

  return (
    <div className="rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-900">
      <p className="font-extrabold">{t('raise.similar.title')}</p>
      <p className="mt-1">
        {t('raise.similar.body', { count, category: categoryLabel })}
      </p>
      {clusterCount > 1 && (
        <p className="mt-1 text-xs font-semibold text-blue-800">
          {t('raise.similar.cluster', { count: clusterCount })}
        </p>
      )}
    </div>
  )
}
