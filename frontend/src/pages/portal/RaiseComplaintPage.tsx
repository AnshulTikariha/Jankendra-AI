import { type FormEvent, useState } from 'react'
import { wards } from '../../data/wards'
import { useAuthStore } from '../../stores/useAuthStore'
import { useComplaintStore } from '../../stores/useComplaintStore'
import { useUiStore } from '../../stores/useUiStore'
import {
  complaintCategoryLabels,
  type ComplaintCategory,
} from '../../types/complaint'

const categories = Object.keys(complaintCategoryLabels) as ComplaintCategory[]

export function RaiseComplaintPage() {
  const session = useAuthStore((s) => s.session)
  const addComplaint = useComplaintStore((s) => s.addComplaint)
  const setCitizenView = useUiStore((s) => s.setCitizenView)
  const setLastComplaintRef = useUiStore((s) => s.setLastComplaintRef)

  const [wardId, setWardId] = useState(wards[3]?.id ?? '42')
  const [category, setCategory] = useState<ComplaintCategory>('water')
  const [description, setDescription] = useState('')
  const [locationDetail, setLocationDetail] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (description.trim().length < 20) {
      setError('Please provide at least 20 characters describing the issue.')
      return
    }
    const ward = wards.find((w) => w.id === wardId)
    if (!ward || !session) return

    const complaint = addComplaint({
      wardId: ward.id,
      wardName: ward.name,
      category,
      description: description.trim(),
      locationDetail: locationDetail.trim() || undefined,
      reporterPhone: session.phone,
      source: 'citizen',
    })

    setLastComplaintRef(complaint.publicReference)
    setCitizenView('confirmation')
  }

  return (
    <section className="space-y-6">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-accent">Report an issue</p>
        <h1 className="mt-2 text-2xl font-extrabold">Tell us what needs attention</h1>
        <p className="mt-2 text-sm text-muted">Your complaint will be recorded and grouped with similar issues in your ward.</p>
      </div>

      <form className="space-y-5 rounded-2xl border border-line bg-white p-5 shadow-sm" onSubmit={handleSubmit}>
        <label className="block">
          <span className="text-sm font-bold">Ward</span>
          <select
            className="mt-2 w-full rounded-xl border border-line bg-white px-4 py-3 font-semibold outline-none focus:ring-4 focus:ring-primary-light/15"
            onChange={(e) => setWardId(e.target.value)}
            value={wardId}
          >
            {wards.map((ward) => (
              <option key={ward.id} value={ward.id}>{ward.name}</option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="text-sm font-bold">Category</span>
          <select
            className="mt-2 w-full rounded-xl border border-line bg-white px-4 py-3 font-semibold outline-none focus:ring-4 focus:ring-primary-light/15"
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
            className="mt-2 w-full rounded-xl border border-line px-4 py-3 font-medium outline-none focus:ring-4 focus:ring-primary-light/15"
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe the issue clearly — location, when it started, and impact on residents."
            rows={4}
            value={description}
          />
        </label>

        <label className="block">
          <span className="text-sm font-bold">Location detail <span className="font-normal text-muted">(optional)</span></span>
          <input
            className="mt-2 w-full rounded-xl border border-line px-4 py-3 font-medium outline-none focus:ring-4 focus:ring-primary-light/15"
            onChange={(e) => setLocationDetail(e.target.value)}
            placeholder="Near main market, Block C, etc."
            type="text"
            value={locationDetail}
          />
        </label>

        {error && <p className="text-sm font-semibold text-red-600" role="alert">{error}</p>}

        <button className="w-full rounded-full bg-primary py-3.5 font-extrabold text-white shadow-lg" type="submit">
          Submit complaint
        </button>
      </form>
    </section>
  )
}
