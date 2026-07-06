import { useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useCitizenProfile } from '../../../hooks/useCitizenProfile'
import { useCities, useResolveWard, useWardBoundary, useWards } from '../../../hooks/useConstituency'
import { useCreateComplaint } from '../../../hooks/useComplaints'
import { useRaiseComplaintDraft } from '../../../hooks/useRaiseComplaintDraft'
import { useSimilarComplaints } from '../../../hooks/useSimilarComplaints'
import {
  descriptionQuality,
  formToCreatePayload,
  getPrimaryCategory,
  includesOtherCategory,
  isOnlyOtherCategory,
} from '../../../lib/raiseComplaintFormat'
import { useAuthStore } from '../../../stores/useAuthStore'
import { useUiStore } from '../../../stores/useUiStore'
import { ApiError } from '../../../api/errors'
import { useComplaintAttachmentsStore } from '../../../stores/useComplaintAttachmentsStore'
import {
  defaultRaiseComplaintForm,
  raiseComplaintSteps,
  type ComplaintDuration,
  type ComplaintImpact,
  type ComplaintPhoto,
  type ComplaintPriority,
  type RaiseComplaintForm,
  type RaiseComplaintStep,
} from '../../../types/raiseComplaint'
import { CategoryCardGrid } from './CategoryCardGrid'
import { CustomCategoryField } from './CustomCategoryField'
import { MapLocationPicker } from './MapLocationPicker'
import { PhotoAttachmentPicker } from './PhotoAttachmentPicker'
import { PriorityPicker } from './PriorityPicker'
import { RaiseComplaintReviewPanel } from './RaiseComplaintReviewPanel'
import { RaiseComplaintStepper } from './RaiseComplaintStepper'
import { SimilarComplaintsBanner } from './SimilarComplaintsBanner'
import { SubCategoryPicker, getSubCategoryLabel } from './SubCategoryPicker'
import { WhatHappensNext } from './WhatHappensNext'

const DESCRIPTION_MIN = 20
const DESCRIPTION_MAX = 500

const durationOptions: ComplaintDuration[] = [
  'today',
  'this_week',
  'this_month',
  'over_month',
  'long_standing',
]

const impactOptions: ComplaintImpact[] = [
  'individual',
  'neighbours',
  'street',
  'public',
]

const priorityOptions: ComplaintPriority[] = ['low', 'medium', 'high', 'critical']

function formatDraftTime(iso: string) {
  return new Date(iso).toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function preferredWardId(wardId: number | '' | undefined): number | null {
  return wardId !== undefined && wardId !== '' ? wardId : null
}

export function RaiseComplaintWizard() {
  const { t } = useTranslation('complaints')
  const session = useAuthStore((s) => s.session)
  const { profile } = useCitizenProfile()
  const createComplaint = useCreateComplaint()
  const setCitizenView = useUiStore((s) => s.setCitizenView)
  const setLastComplaintRef = useUiStore((s) => s.setLastComplaintRef)
  const setLastComplaintId = useUiStore((s) => s.setLastComplaintId)

  const saveAttachments = useComplaintAttachmentsStore((s) => s.saveAttachments)
  const { data: citiesData, isLoading: citiesLoading, isFetched: citiesFetched } = useCities()
  const [city, setCity] = useState('')
  const { data: wardsData, isLoading: wardsLoading } = useWards(city || undefined)
  const resolveWardMutation = useResolveWard()

  const profileWardId = preferredWardId(profile?.wardId)
  const wardOptions = wardsData?.wards ?? []
  const defaultWardId = profileWardId ?? wardOptions[0]?.id ?? 1

  const [form, setForm] = useState<RaiseComplaintForm>(() =>
    defaultRaiseComplaintForm(defaultWardId),
  )
  const [photos, setPhotos] = useState<ComplaintPhoto[]>([])
  const [step, setStep] = useState<RaiseComplaintStep>('where')
  const [error, setError] = useState('')
  const [draftPrompt, setDraftPrompt] = useState<{ savedAt: string } | null>(null)
  const [wardPrefilled, setWardPrefilled] = useState(false)
  const [wardDetected, setWardDetected] = useState<{
    label: string
    confidence: 'inside' | 'nearest'
  } | null>(null)
  const [initialized, setInitialized] = useState(false)
  const resolveTimerRef = useRef<number | null>(null)
  const skipResolveRef = useRef(false)
  const mapResolvedWardRef = useRef<{
    city: string
    wardId: number
    label: string
    confidence: 'inside' | 'nearest'
  } | null>(null)

  const { data: wardBoundaryData } = useWardBoundary(form.wardId)

  const selectedWard = wardOptions.find((ward) => ward.id === form.wardId)
  const activeCity =
    citiesData?.find((item) => item.city === city) ??
    citiesData?.[0] ??
    null
  const mapView = activeCity
    ? {
        center: [activeCity.defaultLat, activeCity.defaultLng] as [number, number],
        zoom: activeCity.defaultZoom,
      }
    : {
        center: [12.9716, 77.5946] as [number, number],
        zoom: 11,
      }
  const wardFocus =
    selectedWard?.centroidLat != null && selectedWard.centroidLng != null
      ? { lat: selectedWard.centroidLat, lng: selectedWard.centroidLng }
      : null

  const { restoreDraft, clearDraft } = useRaiseComplaintDraft(form, step, defaultWardId)

  useEffect(() => {
    if (!citiesData?.length || city) return
    setCity(citiesData[0].city)
  }, [citiesData, city])

  useEffect(() => {
    if (!citiesData?.length || !city) return
    if (citiesData.some((item) => item.city === city)) return
    setCity(citiesData[0].city)
  }, [citiesData, city])

  useEffect(() => {
    if (initialized) return

    const draft = restoreDraft()
    if (draft) {
      setDraftPrompt({ savedAt: formatDraftTime(draft.savedAt) })
    } else if (profileWardId !== null) {
      setForm((f) => ({ ...f, wardId: profileWardId }))
      setWardPrefilled(true)
    }

    setInitialized(true)
  }, [initialized, profileWardId, restoreDraft])

  useEffect(() => {
    if (wardOptions.length === 0) return

    const pending = mapResolvedWardRef.current
    if (pending && city === pending.city) {
      if (wardOptions.some((ward) => ward.id === pending.wardId)) {
        mapResolvedWardRef.current = null
        skipResolveRef.current = true
        setForm((current) => ({ ...current, wardId: pending.wardId }))
        setWardPrefilled(false)
        setWardDetected({
          label: pending.label,
          confidence: pending.confidence,
        })
      }
      return
    }

    setForm((current) => {
      if (wardOptions.some((ward) => ward.id === current.wardId)) return current
      skipResolveRef.current = true
      return { ...current, wardId: wardOptions[0].id }
    })
  }, [city, wardOptions])

  useEffect(() => {
    if (form.latitude == null || form.longitude == null) {
      setWardDetected(null)
      return
    }

    if (skipResolveRef.current) {
      skipResolveRef.current = false
      return
    }

    if (resolveTimerRef.current) {
      window.clearTimeout(resolveTimerRef.current)
    }

    resolveTimerRef.current = window.setTimeout(() => {
      resolveWardMutation.mutate(
        { latitude: form.latitude!, longitude: form.longitude! },
        {
          onSuccess: (result) => {
            const label = result.ward_area_name
              ? `${result.name} — ${result.ward_area_name}`
              : result.name

            skipResolveRef.current = true
            setWardPrefilled(false)
            setWardDetected({
              label,
              confidence: result.confidence,
            })

            if (result.city && result.city !== city) {
              mapResolvedWardRef.current = {
                city: result.city,
                wardId: result.ward_id,
                label,
                confidence: result.confidence,
              }
              setCity(result.city)
              return
            }

            setForm((current) => ({ ...current, wardId: result.ward_id }))
          },
          onError: () => setWardDetected(null),
        },
      )
    }, 500)

    return () => {
      if (resolveTimerRef.current) {
        window.clearTimeout(resolveTimerRef.current)
      }
    }
  }, [form.latitude, form.longitude, resolveWardMutation])

  const primaryCategory = getPrimaryCategory(form.categories)

  const submitMeta = useMemo(
    () => ({
      duration: Object.fromEntries(
        durationOptions.map((d) => [d, t(`raise.details.durationOptions.${d}`)]),
      ) as Record<ComplaintDuration, string>,
      impact: Object.fromEntries(
        impactOptions.map((i) => [i, t(`raise.details.impactOptions.${i}`)]),
      ) as Record<ComplaintImpact, string>,
      priority: Object.fromEntries(
        priorityOptions.map((p) => [p, t(`raise.details.priorityOptions.${p}`)]),
      ) as Record<ComplaintPriority, string>,
      subCategoryLabel: getSubCategoryLabel(primaryCategory, form.subCategory, t),
      categoryLabels: form.categories.map((category) =>
        category === 'other' && form.customCategory.trim()
          ? form.customCategory.trim()
          : t(`raise.categories.${category}`),
      ),
    }),
    [form.categories, form.customCategory, form.subCategory, primaryCategory, t],
  )

  const { count: similarCount, clusterCount, hasSimilar } = useSimilarComplaints(
    form.wardId,
    primaryCategory,
  )

  const stepIndex = raiseComplaintSteps.indexOf(step)
  const descQuality = descriptionQuality(form.description.trim().length)
  const wardName = wardOptions.find((w) => w.id === form.wardId)?.name ?? ''

  const updateForm = <K extends keyof RaiseComplaintForm>(key: K, value: RaiseComplaintForm[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }))
    setError('')
  }

  const handleResumeDraft = () => {
    const draft = restoreDraft()
    if (draft) {
      setForm(draft.form)
      setStep(draft.step)
    }
    setDraftPrompt(null)
  }

  const handleDiscardDraft = () => {
    clearDraft()
    setDraftPrompt(null)
    setForm(defaultRaiseComplaintForm(defaultWardId))
    setPhotos([])
    setStep('where')
    if (profileWardId !== null) {
      setForm((f) => ({ ...f, wardId: profileWardId }))
      setWardPrefilled(true)
    }
  }

  const validateStep = (targetStep: RaiseComplaintStep): boolean => {
    if (targetStep === 'what' || targetStep === 'details' || targetStep === 'review') {
      if (form.description.trim().length < DESCRIPTION_MIN) {
        setError(t('raise.errors.descriptionMin', { min: DESCRIPTION_MIN }))
        return false
      }
      if (form.description.trim().length > DESCRIPTION_MAX) {
        setError(t('raise.details.quality.long'))
        return false
      }
    }
    if (form.categories.length === 0) {
      if (targetStep === 'what' || targetStep === 'details' || targetStep === 'review') {
        setError(t('raise.errors.categoryRequired'))
        return false
      }
    }
    if (primaryCategory !== 'other' && !form.subCategory) {
      if (targetStep === 'details' || targetStep === 'review') {
        setError(t('raise.errors.subCategoryRequired'))
        return false
      }
    }
    if (isOnlyOtherCategory(form.categories) && form.customCategory.trim().length < 2) {
      if (targetStep === 'details' || targetStep === 'review') {
        setError(t('raise.errors.customCategoryRequired'))
        return false
      }
    }
    return true
  }

  const handleCategoriesChange = (categories: typeof form.categories) => {
    const prevPrimary = getPrimaryCategory(form.categories)
    const nextPrimary = getPrimaryCategory(categories)
    setForm((prev) => ({
      ...prev,
      categories,
      subCategory: nextPrimary !== prevPrimary ? '' : prev.subCategory,
      customCategory: includesOtherCategory(categories) ? prev.customCategory : '',
    }))
    setError('')
  }

  const goNext = () => {
    const next = raiseComplaintSteps[stepIndex + 1]
    if (!next) return
    if (step === 'where' && !validateStep('what')) return
    if (step === 'what' && !validateStep('details')) return
    if (step === 'details' && !validateStep('review')) return
    // Defer review transition so the Continue click cannot land on Submit (same slot).
    if (next === 'review') {
      window.setTimeout(() => {
        setStep('review')
        setError('')
      }, 0)
      return
    }
    setStep(next)
    setError('')
  }

  const goBack = () => {
    const prev = raiseComplaintSteps[stepIndex - 1]
    if (prev) {
      setStep(prev)
      setError('')
    }
  }

  const goToStep = (target: RaiseComplaintStep) => {
    const targetIndex = raiseComplaintSteps.indexOf(target)
    if (targetIndex <= stepIndex) {
      setStep(target)
      setError('')
    }
  }

  const submitComplaint = async () => {
    if (step !== 'review') return

    if (!validateStep('review')) {
      if (form.description.trim().length < DESCRIPTION_MIN) {
        setStep('where')
      } else {
        setStep('details')
      }
      return
    }

    setError('')

    try {
      const complaint = await createComplaint.mutateAsync(
        formToCreatePayload(form, submitMeta),
      )

      if (photos.length > 0) {
        saveAttachments(complaint.id, photos)
      }

      clearDraft()
      setPhotos([])
      setLastComplaintId(complaint.id)
      setLastComplaintRef(complaint.publicReference)
      setCitizenView('confirmation')
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t('raise.errors.generic'))
    }
  }

  const handleContinue = (event: React.MouseEvent) => {
    event.preventDefault()
    event.stopPropagation()
    goNext()
  }

  return (
    <section className="space-y-4">
      <div className="overflow-hidden rounded-3xl border border-line/80 bg-white shadow-md">
        <div className="border-b border-line/80 bg-gradient-to-r from-rose-50/50 to-white px-5 py-4 sm:px-6">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-accent">
            {t('raise.eyebrow')}
          </p>
          <h1 className="mt-1 text-2xl font-extrabold">{t('raise.title')}</h1>
          <p className="mt-2 text-sm text-muted">{t('raise.subtitle')}</p>
          <div className="mt-4">
            <RaiseComplaintStepper current={step} />
          </div>
        </div>

        <div className="space-y-4 p-5 sm:p-6">
          <WhatHappensNext />

          {draftPrompt && (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
              <p className="font-extrabold">{t('raise.draft.resumeTitle')}</p>
              <p className="mt-1">{t('raise.draft.resumeBody', { time: draftPrompt.savedAt })}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  className="rounded-full bg-amber-700 px-4 py-1.5 text-xs font-bold text-white"
                  onClick={handleResumeDraft}
                  type="button"
                >
                  {t('raise.draft.resume')}
                </button>
                <button
                  className="rounded-full border border-amber-300 px-4 py-1.5 text-xs font-bold text-amber-900"
                  onClick={handleDiscardDraft}
                  type="button"
                >
                  {t('raise.draft.discard')}
                </button>
              </div>
            </div>
          )}

          <div className="space-y-5">
            {step === 'where' && (
              <div className="space-y-5">
                <label className="block">
                  <span className="text-sm font-bold">
                    {t('raise.details.titleOptional')}{' '}
                    <span className="font-normal text-muted">{t('raise.details.titleOptionalHint')}</span>
                  </span>
                  <input
                    className="mt-2 w-full rounded-xl border border-line bg-white px-4 py-3 font-medium outline-none focus:ring-4 focus:ring-teal-200/40"
                    maxLength={120}
                    onChange={(e) => updateForm('title', e.target.value)}
                    placeholder={t('raise.details.titlePlaceholder')}
                    type="text"
                    value={form.title}
                  />
                </label>

                <label className="block">
                  <span className="text-sm font-bold">{t('raise.details.description')}</span>
                  <p className="mt-0.5 text-xs text-muted">{t('raise.details.descriptionHint')}</p>
                  <textarea
                    className="mt-2 w-full rounded-xl border border-line bg-white px-4 py-3 font-medium outline-none focus:ring-4 focus:ring-teal-200/40"
                    maxLength={DESCRIPTION_MAX}
                    onChange={(e) => updateForm('description', e.target.value)}
                    placeholder={t(`raise.what.examples.${primaryCategory}`)}
                    rows={5}
                    value={form.description}
                  />
                  <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                    <p className="text-xs font-semibold text-muted">
                      {t('raise.details.charCount', {
                        count: form.description.trim().length,
                        max: DESCRIPTION_MAX,
                      })}
                    </p>
                    <p
                      className={`text-xs font-bold ${
                        descQuality === 'short'
                          ? 'text-amber-700'
                          : descQuality === 'good'
                            ? 'text-teal-700'
                            : 'text-muted'
                      }`}
                    >
                      {t(`raise.details.quality.${descQuality}`, { min: DESCRIPTION_MIN })}
                    </p>
                  </div>
                </label>

                <label className="block">
                  <span className="text-sm font-bold">{t('raise.where.city')}</span>
                  <p className="mt-0.5 text-xs text-muted">{t('raise.where.cityHint')}</p>
                  <select
                    className="mt-2 w-full rounded-xl border border-line bg-white px-4 py-3 font-semibold outline-none focus:ring-4 focus:ring-teal-200/40 disabled:opacity-60"
                    disabled={citiesLoading || !citiesData?.length}
                    onChange={(event) => {
                      mapResolvedWardRef.current = null
                      setCity(event.target.value)
                      setWardPrefilled(false)
                      setWardDetected(null)
                      skipResolveRef.current = true
                    }}
                    value={city}
                  >
                    {!city && (
                      <option disabled value="">
                        {citiesLoading ? t('raise.where.cityLoading') : t('raise.where.citySelect')}
                      </option>
                    )}
                    {(citiesData ?? []).map((item) => (
                      <option key={item.city} value={item.city}>
                        {item.wardCount > 0
                          ? `${item.displayName} (${item.wardCount})`
                          : item.displayName}
                      </option>
                    ))}
                  </select>
                  {citiesLoading && (
                    <p className="mt-1 text-xs text-muted">{t('raise.where.cityLoading')}</p>
                  )}
                  {citiesFetched && citiesData?.every((item) => item.wardCount === 0) && (
                    <p className="mt-1 text-xs font-semibold text-amber-700">
                      {t('raise.where.cityApiHint')}
                    </p>
                  )}
                </label>

                <label className="block">
                  <span className="text-sm font-bold">{t('raise.where.ward')}</span>
                  <p className="mt-0.5 text-xs text-muted">{t('raise.where.wardHint')}</p>
                  {wardPrefilled && (
                    <p className="mt-1 text-xs font-semibold text-teal-700">
                      {t('raise.where.wardPrefilled')}
                    </p>
                  )}
                  {wardDetected && (
                    <p className="mt-1 text-xs font-semibold text-teal-800">
                      {wardDetected.confidence === 'inside'
                        ? t('raise.where.wardDetected', { ward: wardDetected.label })
                        : t('raise.where.wardDetectedNearest', { ward: wardDetected.label })}
                    </p>
                  )}
                  <select
                    className="mt-2 w-full rounded-xl border border-line bg-white px-4 py-3 font-semibold outline-none focus:ring-4 focus:ring-teal-200/40 disabled:opacity-60"
                    disabled={wardsLoading || wardOptions.length === 0}
                    onChange={(e) => {
                      skipResolveRef.current = true
                      updateForm('wardId', Number(e.target.value))
                      setWardPrefilled(false)
                      setWardDetected(null)
                    }}
                    value={form.wardId}
                  >
                    {wardOptions.map((ward) => (
                      <option key={ward.id} value={ward.id}>
                        {ward.wardAreaName ? `${ward.name} — ${ward.wardAreaName}` : ward.name}
                      </option>
                    ))}
                  </select>
                  {wardsLoading && (
                    <p className="mt-1 text-xs text-muted">{t('raise.where.wardLoading')}</p>
                  )}
                </label>

                <MapLocationPicker
                  mapView={mapView}
                  onChange={({ latitude, longitude, locationDetail }) => {
                    setForm((prev) => ({ ...prev, latitude, longitude, locationDetail }))
                    setError('')
                  }}
                  searchBias={
                    activeCity
                      ? {
                          lat: activeCity.defaultLat,
                          lng: activeCity.defaultLng,
                          cityName: activeCity.displayName,
                        }
                      : undefined
                  }
                  value={{
                    latitude: form.latitude,
                    longitude: form.longitude,
                    locationDetail: form.locationDetail,
                  }}
                  wardBoundary={wardBoundaryData?.geometry ?? null}
                  wardFocus={wardFocus}
                />

                {session?.phone && (
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                    <p className="text-xs font-bold text-muted">{t('raise.where.contact')}</p>
                    <p className="mt-1 font-extrabold text-ink">+91 {session.phone}</p>
                    <p className="mt-1 text-xs text-muted">{t('raise.where.contactHint')}</p>
                  </div>
                )}
              </div>
            )}

            {step === 'what' && (
              <div className="space-y-4">
                <div>
                  <h2 className="text-lg font-extrabold">{t('raise.what.title')}</h2>
                  <p className="mt-1 text-sm text-muted">{t('raise.what.subtitle')}</p>
                </div>
                <CategoryCardGrid
                  onChange={handleCategoriesChange}
                  value={form.categories}
                />
                {includesOtherCategory(form.categories) && (
                  <CustomCategoryField
                    onChange={(value) => updateForm('customCategory', value)}
                    value={form.customCategory}
                  />
                )}
                {primaryCategory !== 'other' && (
                  <>
                    {form.categories.length > 1 && (
                      <p className="text-xs font-semibold text-teal-800">
                        {t('raise.what.subCategoryPrimaryHint', {
                          category: t(`raise.categories.${primaryCategory}`),
                        })}
                      </p>
                    )}
                    <SubCategoryPicker
                      category={primaryCategory}
                      onChange={(subCategory) => updateForm('subCategory', subCategory)}
                      value={form.subCategory}
                    />
                  </>
                )}
              </div>
            )}

            {step === 'details' && (
              <div className="space-y-5">
                {includesOtherCategory(form.categories) && (
                  <CustomCategoryField
                    onChange={(value) => updateForm('customCategory', value)}
                    value={form.customCategory}
                  />
                )}

                {!form.subCategory && primaryCategory !== 'other' && (
                  <SubCategoryPicker
                    category={primaryCategory}
                    onChange={(subCategory) => updateForm('subCategory', subCategory)}
                    value={form.subCategory}
                  />
                )}

                <PriorityPicker
                  onChange={(priority) => updateForm('priority', priority)}
                  value={form.priority}
                />

                <PhotoAttachmentPicker onChange={setPhotos} photos={photos} />

                {hasSimilar && (
                  <SimilarComplaintsBanner
                    category={primaryCategory}
                    clusterCount={clusterCount}
                    count={similarCount}
                  />
                )}

                <fieldset>
                  <legend className="text-sm font-bold">{t('raise.details.duration')}</legend>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {durationOptions.map((option) => (
                      <Chip
                        key={option}
                        label={t(`raise.details.durationOptions.${option}`)}
                        onClick={() => updateForm('duration', form.duration === option ? '' : option)}
                        selected={form.duration === option}
                      />
                    ))}
                  </div>
                </fieldset>

                <fieldset>
                  <legend className="text-sm font-bold">{t('raise.details.impact')}</legend>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {impactOptions.map((option) => (
                      <Chip
                        key={option}
                        label={t(`raise.details.impactOptions.${option}`)}
                        onClick={() => updateForm('impact', form.impact === option ? '' : option)}
                        selected={form.impact === option}
                      />
                    ))}
                  </div>
                </fieldset>
              </div>
            )}

            {step === 'review' && (
              <RaiseComplaintReviewPanel
                clusterCount={clusterCount}
                form={form}
                hasSimilar={hasSimilar}
                onEdit={goToStep}
                phone={session?.phone}
                photos={photos}
                similarCount={similarCount}
                submitMeta={submitMeta}
                wardName={wardName}
              />
            )}

            {error && (
              <p className="text-sm font-semibold text-red-600" role="alert">{error}</p>
            )}

            <div className="flex flex-col-reverse gap-3 border-t border-line/60 pt-4 sm:flex-row sm:justify-between">
              {stepIndex > 0 ? (
                <button
                  className="rounded-full border border-line px-6 py-3 text-sm font-extrabold text-muted"
                  onClick={goBack}
                  type="button"
                >
                  {t('raise.nav.back')}
                </button>
              ) : (
                <span />
              )}

              {step !== 'review' ? (
                <button
                  className="rounded-full bg-gradient-to-r from-teal-600 to-emerald-600 px-6 py-3 text-sm font-extrabold text-white shadow-lg"
                  onClick={handleContinue}
                  type="button"
                >
                  {step === 'details' ? t('raise.nav.continueToReview') : t('raise.nav.continue')}
                </button>
              ) : (
                <button
                  className="rounded-full bg-gradient-to-r from-teal-600 to-emerald-600 px-6 py-3 text-sm font-extrabold text-white shadow-lg disabled:opacity-60"
                  disabled={createComplaint.isPending}
                  onClick={() => void submitComplaint()}
                  type="button"
                >
                  {createComplaint.isPending ? t('raise.nav.submitting') : t('raise.nav.submit')}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

function Chip({
  label,
  selected,
  onClick,
}: {
  label: string
  selected: boolean
  onClick: () => void
}) {
  return (
    <button
      className={`rounded-full border px-3 py-1.5 text-xs font-bold transition ${
        selected
          ? 'border-teal-500 bg-teal-50 text-teal-800'
          : 'border-line bg-white text-muted hover:border-teal-200'
      }`}
      onClick={onClick}
      type="button"
    >
      {label}
    </button>
  )
}
