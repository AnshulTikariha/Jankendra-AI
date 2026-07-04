import { useAuthStore } from '../../stores/useAuthStore'
import { roleLabels } from '../../types/auth'
import { PageHeader } from '../../components/staff/PageStates'

export function ProfilePage() {
  const session = useAuthStore((s) => s.session)

  if (!session) return null

  const fields = [
    { label: 'Name', value: session.name },
    { label: 'Role', value: roleLabels[session.role] },
    { label: 'Phone', value: `+91 ${session.phone}` },
    { label: 'Constituency', value: session.constituencyName },
    { label: 'User ID', value: session.userId },
  ]

  return (
    <section className="space-y-4">
      <PageHeader
        description="Account details from your authenticated session."
        eyebrow="Profile"
        title="Your account"
      />
      <div className="overflow-hidden rounded-3xl border border-line/80 bg-white shadow-md">
        <dl className="divide-y divide-line/60">
          {fields.map((field) => (
            <div className="grid gap-1 px-5 py-4 sm:grid-cols-[10rem_1fr]" key={field.label}>
              <dt className="text-xs font-bold uppercase tracking-wide text-muted">{field.label}</dt>
              <dd className="font-semibold text-ink">{field.value}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  )
}
