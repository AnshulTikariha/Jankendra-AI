import { create } from 'zustand'
import type {
  CitizenComplaintStatus,
  Complaint,
  ComplaintCategory,
} from '../types/complaint'

const COMPLAINTS_STORAGE_KEY = 'jankendra-complaints'

type CreateComplaintInput = {
  wardId: string
  wardName: string
  category: ComplaintCategory
  description: string
  locationDetail?: string
  reporterPhone: string
  source: 'citizen' | 'staff'
}

type ComplaintState = {
  complaints: Complaint[]
  addComplaint: (input: CreateComplaintInput) => Complaint
  getByPhone: (phone: string) => Complaint[]
}

function readStoredComplaints(): Complaint[] {
  if (typeof window === 'undefined') return []
  const raw = window.localStorage.getItem(COMPLAINTS_STORAGE_KEY)
  if (!raw) return seedComplaints()
  try {
    const parsed = JSON.parse(raw) as Complaint[]
    return parsed.length > 0 ? parsed : seedComplaints()
  } catch {
    return seedComplaints()
  }
}

function seedComplaints(): Complaint[] {
  return [
    {
      id: 'seed-1',
      publicReference: 'JK-2026-0001',
      wardId: '42',
      wardName: 'Ward 42',
      category: 'drainage',
      description: 'Standing water after rain near the main market entrance.',
      status: 'under_review',
      clusterCount: 11,
      source: 'citizen',
      submittedAt: '2026-06-28T14:20:00',
      reporterPhone: '9000000001',
    },
  ]
}

function persist(complaints: Complaint[]) {
  window.localStorage.setItem(COMPLAINTS_STORAGE_KEY, JSON.stringify(complaints))
}

function nextReference(complaints: Complaint[]): string {
  const year = new Date().getFullYear()
  const count = complaints.filter((c) => c.publicReference.includes(String(year))).length + 1
  return `JK-${year}-${String(count).padStart(4, '0')}`
}

export const useComplaintStore = create<ComplaintState>((set, get) => ({
  complaints: readStoredComplaints(),

  addComplaint: (input) => {
    const complaints = get().complaints
    const similarInWard = complaints.filter(
      (c) => c.wardId === input.wardId && c.category === input.category,
    )
    const clusterCount = similarInWard.length + 1

    const complaint: Complaint = {
      id: crypto.randomUUID(),
      publicReference: nextReference(complaints),
      wardId: input.wardId,
      wardName: input.wardName,
      category: input.category,
      description: input.description,
      locationDetail: input.locationDetail,
      status: 'submitted' satisfies CitizenComplaintStatus,
      clusterCount,
      source: input.source,
      submittedAt: new Date().toISOString(),
      reporterPhone: input.reporterPhone,
    }

    const next = [complaint, ...complaints]
    persist(next)
    set({ complaints: next })
    return complaint
  },

  getByPhone: (phone) => get().complaints.filter((c) => c.reporterPhone === phone),
}))
