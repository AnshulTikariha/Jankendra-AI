import { create } from 'zustand'
import type { CitizenComplaintStatus } from '../types/complaint'

const OVERRIDES_STORAGE_KEY = 'jankendra-complaint-overrides'

export type ComplaintOverride = {
  status?: CitizenComplaintStatus
  staffNote?: string
  assignedDepartment?: string
  updatedAt: string
}

type OverridesMap = Record<string, ComplaintOverride>

type ComplaintOverridesState = {
  overrides: OverridesMap
  updateOverride: (complaintId: string, patch: Omit<ComplaintOverride, 'updatedAt'>) => void
  getOverride: (complaintId: string) => ComplaintOverride | undefined
}

function readOverrides(): OverridesMap {
  if (typeof window === 'undefined') return {}
  const raw = window.localStorage.getItem(OVERRIDES_STORAGE_KEY)
  if (!raw) return {}
  try {
    return JSON.parse(raw) as OverridesMap
  } catch {
    return {}
  }
}

function persistOverrides(overrides: OverridesMap) {
  window.localStorage.setItem(OVERRIDES_STORAGE_KEY, JSON.stringify(overrides))
}

export const useComplaintOverridesStore = create<ComplaintOverridesState>((set, get) => ({
  overrides: readOverrides(),

  updateOverride: (complaintId, patch) => {
    const next = {
      ...get().overrides,
      [complaintId]: {
        ...get().overrides[complaintId],
        ...patch,
        updatedAt: new Date().toISOString(),
      },
    }
    persistOverrides(next)
    set({ overrides: next })
  },

  getOverride: (complaintId) => get().overrides[complaintId],
}))

export function applyComplaintOverride<T extends {
  id: string
  status: CitizenComplaintStatus
  departmentSuggestion?: string
}>(
  complaint: T,
  override?: ComplaintOverride,
): T & { hasLocalOverride: boolean; staffNote?: string } {
  if (!override) {
    return { ...complaint, hasLocalOverride: false }
  }
  return {
    ...complaint,
    status: override.status ?? complaint.status,
    departmentSuggestion: override.assignedDepartment ?? complaint.departmentSuggestion,
    staffNote: override.staffNote,
    hasLocalOverride: Boolean(
      override.status || override.staffNote || override.assignedDepartment,
    ),
  }
}
