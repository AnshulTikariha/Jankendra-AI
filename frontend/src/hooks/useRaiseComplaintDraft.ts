import { useCallback, useEffect, useRef } from 'react'
import type { ComplaintCategory } from '../types/complaint'
import { defaultRaiseComplaintForm, type RaiseComplaintForm, type RaiseComplaintStep } from '../types/raiseComplaint'
import { useAuthStore } from '../stores/useAuthStore'

const DRAFT_STORAGE_KEY = 'jankendra-raise-complaint-draft'

type SavedDraft = {
  form: RaiseComplaintForm
  step: RaiseComplaintStep
  savedAt: string
}

type LegacyDraftForm = RaiseComplaintForm & { category?: ComplaintCategory }

function normalizeDraftForm(form: LegacyDraftForm): RaiseComplaintForm {
  if (form.categories?.length) return form
  if (form.category) {
    const { category, ...rest } = form
    return { ...rest, categories: [category] }
  }
  return { ...form, categories: ['water'] }
}

function readAllDrafts(): Record<string, SavedDraft> {
  if (typeof window === 'undefined') return {}
  const raw = window.localStorage.getItem(DRAFT_STORAGE_KEY)
  if (!raw) return {}
  try {
    return JSON.parse(raw) as Record<string, SavedDraft>
  } catch {
    return {}
  }
}

function readDraft(userId: string): SavedDraft | null {
  return readAllDrafts()[userId] ?? null
}

function persistDraft(userId: string, draft: SavedDraft | null) {
  const all = readAllDrafts()
  if (draft) {
    all[userId] = draft
  } else {
    delete all[userId]
  }

  if (Object.keys(all).length === 0) {
    window.localStorage.removeItem(DRAFT_STORAGE_KEY)
  } else {
    window.localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(all))
  }
}

function isDraftEmpty(form: RaiseComplaintForm): boolean {
  return (
    !form.title.trim() &&
    !form.description.trim() &&
    !form.locationDetail.trim() &&
    !form.customCategory.trim() &&
    !form.subCategory &&
    form.latitude == null &&
    !form.duration &&
    !form.impact &&
    form.priority === 'medium'
  )
}

export function useRaiseComplaintDraft(
  form: RaiseComplaintForm,
  step: RaiseComplaintStep,
) {
  const userId = useAuthStore((s) => s.session?.userId ?? '')
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const loadDraft = useCallback((): SavedDraft | null => {
    if (!userId) return null
    return readDraft(userId)
  }, [userId])

  const clearDraft = useCallback(() => {
    if (!userId) return
    persistDraft(userId, null)
  }, [userId])

  const restoreDraft = useCallback((): {
    form: RaiseComplaintForm
    step: RaiseComplaintStep
    savedAt: string
  } | null => {
    if (!userId) return null
    const draft = readDraft(userId)
    if (!draft || isDraftEmpty(normalizeDraftForm(draft.form))) return null
    return {
      form: normalizeDraftForm(draft.form),
      step: draft.step,
      savedAt: draft.savedAt,
    }
  }, [userId])

  useEffect(() => {
    if (!userId) return

    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
    }

    debounceRef.current = setTimeout(() => {
      if (isDraftEmpty(form)) {
        persistDraft(userId, null)
        return
      }
      persistDraft(userId, {
        form,
        step,
        savedAt: new Date().toISOString(),
      })
    }, 400)

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [form, step, userId])

  const initialForm = defaultRaiseComplaintForm()

  return {
    initialForm,
    loadDraft,
    restoreDraft,
    clearDraft,
  }
}
