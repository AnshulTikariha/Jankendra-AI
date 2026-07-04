import { type FormEvent, useState } from 'react'
import { wardOptions } from '../../data/wards'
import { useCreateComplaint } from '../../hooks/useComplaints'
import { useUiStore } from '../../stores/useUiStore'
import { ApiError } from '../../api/errors'
import {
  complaintCategoryLabels,
  type ComplaintCategory,
} from '../../types/complaint'

const categories = Object.keys(complaintCategoryLabels) as ComplaintCategory[]

export function RaiseComplaintPage() {
  const createComplaint = useCreateComplaint()
  const setCitizenView = useUiStore((s) => s.setCitizenView)
  const setLastComplaintRef = useUiStore((s) => s.setLastComplaintRef)
  const setLastComplaintId = useUiStore((s) => s.setLastComplaintId)

  const [wardId, setWardId] = useState(wardOptions[0]?.id ?? 1)
  const [category, setCategory] = useState<ComplaintCategory>('water')
  const [description, setDescription] = useState('')
  const [locationDetail, setLocationDetail] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (description.trim().length < 20) {
      setError('Please provide at least 20 characters describing the issue.')
      return
    }

    setError('')

    try {
      const complaint = await createComplaint.mutateAsync({
        ward_id: wardId,
        category,
        description: description.trim(),
        location_detail: locationDetail.trim() || undefined,
      })

      setLastComplaintId(complaint.id)
      setLastComplaintRef(complaint.publicReference)
      setCitizenView('confirmation')
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Something went wrong. Please try again.')
    }
  }

  return (
    <section className="space-y-6">
      <div className="overflow-hidden rounded-3xl border border-line/80 bg-white shadow-md">
        <div className="border-b border-line/80 bg-gradient-to-r from-rose-50/50 to-white px-5 py-4 sm:px-6">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-accent">Report an issue</p>
          <h1 className="mt-1 text-2xl font-extrabold">Tell us what needs attention</h1>
          <p className="mt-2 text-sm text-muted">
            Your complaint will be recorded and grouped with similar issues in your ward.
          </p>
        </div>

        <form className="space-y-5 p-5 sm:p-6" onSubmit={(event) => void handleSubmit(event)}>
          <label className="block">
            <span className="text-sm font-bold">Ward</span>
            <select
              className="mt-2 w-full rounded-xl border border-line bg-white px-4 py-3 font-semibold outline-none focus:ring-4 focus:ring-teal-200/40"
              onChange={(e) => setWardId(Number(e.target.value))}
              value={wardId}
            >
              {wardOptions.map((ward) => (
                <option key={ward.id} value={ward.id}>{ward.name}</option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="text-sm font-bold">Category</span>
            <select
              className="mt-2 w-full rounded-xl border border-line bg-white px-4 py-3 font-semibold outline-none focus:ring-4 focus:ring-teal-200/40"
              onChange={(e) => setCategory(e.target.value as ComplaintCategory)}
              value={category}
            >
              {categories.map((cat) => (
                <option key={cat} value={cat}>{complaintCategoryLabels[cat]}</option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="text-sm font-bold">Description</span>
            <textarea
              className="mt-2 w-full rounded-xl border border-line px-4 py-3 font-medium outline-none focus:ring-4 focus:ring-teal-200/40"
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the issue clearly — location, when it started, and impact on residents."
              rows={4}
              value={description}
            />
          </label>

          <label className="block">
            <span className="text-sm font-bold">Location detail <span className="font-normal text-muted">(optional)</span></span>
            <input
              className="mt-2 w-full rounded-xl border border-line px-4 py-3 font-medium outline-none focus:ring-4 focus:ring-teal-200/40"
              onChange={(e) => setLocationDetail(e.target.value)}
              placeholder="Near main market, Block C, etc."
              type="text"
              value={locationDetail}
            />
          </label>

          {error && <p className="text-sm font-semibold text-red-600" role="alert">{error}</p>}

          <button
            className="w-full rounded-full bg-gradient-to-r from-teal-600 to-emerald-600 py-3.5 font-extrabold text-white shadow-lg transition hover:shadow-xl disabled:opacity-60"
            disabled={createComplaint.isPending}
            type="submit"
          >
            {createComplaint.isPending ? 'Submitting…' : 'Submit complaint'}
          </button>
        </form>
      </div>
    </section>
  )
}
