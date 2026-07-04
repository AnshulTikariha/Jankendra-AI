import { type FormEvent, useState } from 'react'
import { ApiError } from '../../api/errors'
import { PageHeader } from '../../components/staff/PageStates'
import { useStaffCreateComplaint, useWards } from '../../hooks/useStaffApi'
import {
  complaintCategoryLabels,
  type ComplaintCategory,
} from '../../types/complaint'

const categories = Object.keys(complaintCategoryLabels) as ComplaintCategory[]

export function LogIssuePage() {
  const { data: wardsData, isLoading: wardsLoading } = useWards()
  const createComplaint = useStaffCreateComplaint()
  const [wardId, setWardId] = useState<number | ''>('')
  const [category, setCategory] = useState<ComplaintCategory>('water')
  const [description, setDescription] = useState('')
  const [locationDetail, setLocationDetail] = useState('')
  const [citizenContact, setCitizenContact] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [successRef, setSuccessRef] = useState<string | null>(null)

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    if (!wardId) {
      setError('Please select a ward.')
      return
    }
    setError(null)
    setSuccessRef(null)
    try {
      const result = await createComplaint.mutateAsync({
        ward_id: wardId,
        category,
        description: description.trim(),
        location_detail: locationDetail.trim() || undefined,
        citizen_contact: citizenContact.trim() || undefined,
      })
      setSuccessRef(result.public_reference)
      setDescription('')
      setLocationDetail('')
      setCitizenContact('')
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Something went wrong.')
    }
  }

  return (
    <section className="space-y-4">
      <PageHeader
        description="Log a citizen complaint on behalf of a resident. Uses live ward data from the constituency API."
        eyebrow="Complaint intake"
        title="Log issue"
      />

      <form className="space-y-5 rounded-3xl border border-line/80 bg-white p-5 shadow-md sm:p-6" onSubmit={(e) => void handleSubmit(e)}>
        <label className="block">
          <span className="text-sm font-bold">Ward</span>
          <select
            className="mt-2 w-full rounded-xl border border-line px-4 py-3 font-semibold disabled:opacity-50"
            disabled={wardsLoading}
            onChange={(e) => setWardId(Number(e.target.value))}
            required
            value={wardId}
          >
            <option value="">Select ward</option>
            {wardsData?.wards.map((w) => (
              <option key={w.id} value={w.id}>{w.name}</option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="text-sm font-bold">Citizen phone (optional)</span>
          <input
            className="mt-2 w-full rounded-xl border border-line px-4 py-3 font-semibold"
            maxLength={10}
            onChange={(e) => setCitizenContact(e.target.value.replace(/\D/g, '').slice(0, 10))}
            placeholder="10-digit mobile"
            value={citizenContact}
          />
        </label>

        <label className="block">
          <span className="text-sm font-bold">Category</span>
          <select
            className="mt-2 w-full rounded-xl border border-line px-4 py-3 font-semibold"
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
            className="mt-2 w-full rounded-xl border border-line px-4 py-3"
            onChange={(e) => setDescription(e.target.value)}
            required
            rows={4}
            value={description}
          />
        </label>

        <label className="block">
          <span className="text-sm font-bold">Location detail (optional)</span>
          <input
            className="mt-2 w-full rounded-xl border border-line px-4 py-3"
            onChange={(e) => setLocationDetail(e.target.value)}
            value={locationDetail}
          />
        </label>

        {error && <p className="text-sm font-semibold text-red-600">{error}</p>}
        {successRef && (
          <p className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800">
            Complaint logged: <span className="font-mono">{successRef}</span>
          </p>
        )}

        <button
          className="rounded-full bg-primary px-6 py-3 text-sm font-extrabold text-white disabled:opacity-50"
          disabled={createComplaint.isPending}
          type="submit"
        >
          {createComplaint.isPending ? 'Submitting…' : 'Log complaint'}
        </button>
      </form>
    </section>
  )
}
