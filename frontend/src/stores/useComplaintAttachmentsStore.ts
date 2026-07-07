import { create } from 'zustand'
import type { ComplaintPhoto } from '../types/raiseComplaint'

const ATTACHMENTS_STORAGE_KEY = 'jankendra-complaint-attachments'
const EMPTY_ATTACHMENTS: ComplaintPhoto[] = []

type AttachmentsMap = Record<string, ComplaintPhoto[]>

type ComplaintAttachmentsState = {
  attachments: AttachmentsMap
  saveAttachments: (complaintId: string, photos: ComplaintPhoto[]) => void
  getAttachments: (complaintId: string) => ComplaintPhoto[]
}

function readAttachments(): AttachmentsMap {
  if (typeof window === 'undefined') return {}
  const raw = window.localStorage.getItem(ATTACHMENTS_STORAGE_KEY)
  if (!raw) return {}
  try {
    return JSON.parse(raw) as AttachmentsMap
  } catch {
    return {}
  }
}

function persistAttachments(attachments: AttachmentsMap) {
  window.localStorage.setItem(ATTACHMENTS_STORAGE_KEY, JSON.stringify(attachments))
}

export const useComplaintAttachmentsStore = create<ComplaintAttachmentsState>((set, get) => ({
  attachments: readAttachments(),

  saveAttachments: (complaintId, photos) => {
    if (photos.length === 0) return
    const next = { ...get().attachments, [complaintId]: photos }
    persistAttachments(next)
    set({ attachments: next })
  },

  getAttachments: (complaintId) => get().attachments[complaintId] ?? EMPTY_ATTACHMENTS,
}))
