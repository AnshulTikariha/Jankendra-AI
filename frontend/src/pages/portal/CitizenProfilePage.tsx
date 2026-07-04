import { useEffect, useState } from 'react'
import { wardOptions } from '../../data/wards'
import { useCitizenProfile, type CitizenProfileForm } from '../../hooks/useCitizenProfile'
import { supportedLocales, localeLabels, type SupportedLocale } from '../../i18n/config'
import { getRoleTheme } from '../../theme/roleThemes'

function profileToForm(profile: NonNullable<ReturnType<typeof useCitizenProfile>['profile']>): CitizenProfileForm {
  return {
    displayName: profile.displayName,
    wardId: profile.wardId,
    email: profile.email,
    notifySms: profile.notifySms,
    notifyEmail: profile.notifyEmail,
    locale: profile.locale,
  }
}

function isValidEmail(value: string) {
  if (!value.trim()) return true
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())
}

export function CitizenProfilePage() {
  const theme = getRoleTheme('citizen')
  const { profile, saveProfile } = useCitizenProfile()
  const [isEditing, setIsEditing] = useState(false)
  const [form, setForm] = useState<CitizenProfileForm | null>(null)
  const [savedMessage, setSavedMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (profile && !isEditing) {
      setForm(profileToForm(profile))
    }
  }, [profile, isEditing])

  if (!profile || !form) return null

  const startEditing = () => {
    setForm(profileToForm(profile))
    setIsEditing(true)
    setSavedMessage(null)
    setError(null)
  }

  const cancelEditing = () => {
    setForm(profileToForm(profile))
    setIsEditing(false)
    setError(null)
  }

  const handleSave = () => {
    const trimmedName = form.displayName.trim()
    if (trimmedName.length < 2) {
      setError('Display name must be at least 2 characters.')
      return
    }
    if (!isValidEmail(form.email)) {
      setError('Enter a valid email address or leave it blank.')
      return
    }

    saveProfile({ ...form, displayName: trimmedName })
    setIsEditing(false)
    setSavedMessage('Profile saved on this device. Server sync pending backend API.')
    setError(null)
  }

  const readOnlyFields = [
    { label: 'Phone', value: `+91 ${profile.phone}` },
    { label: 'Role', value: profile.roleLabel },
    { label: 'Constituency', value: profile.constituencyName },
    { label: 'Account ID', value: profile.userId },
  ]

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className={`text-xs font-bold uppercase tracking-[0.18em] ${theme.sectionEyebrow}`}>Profile</p>
          <h1 className="mt-1 text-2xl font-extrabold text-ink sm:text-3xl">Your account</h1>
          <p className="mt-2 max-w-xl text-sm text-muted">
            View and update your contact details and preferences for the citizen portal.
          </p>
        </div>
        {!isEditing ? (
          <button
            className={`rounded-full bg-gradient-to-r ${theme.sidebarHeaderGradient} px-5 py-2.5 text-sm font-extrabold text-white shadow-md transition hover:opacity-95`}
            onClick={startEditing}
            type="button"
          >
            Edit profile
          </button>
        ) : (
          <div className="flex flex-wrap gap-2">
            <button
              className="rounded-full border border-line px-5 py-2.5 text-sm font-bold text-muted"
              onClick={cancelEditing}
              type="button"
            >
              Cancel
            </button>
            <button
              className={`rounded-full bg-gradient-to-r ${theme.sidebarHeaderGradient} px-5 py-2.5 text-sm font-extrabold text-white shadow-md`}
              onClick={handleSave}
              type="button"
            >
              Save changes
            </button>
          </div>
        )}
      </div>

      <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
        <strong>Preview mode:</strong> Profile edits are saved on this device only until{' '}
        <code className="rounded bg-amber-100 px-1">PATCH /auth/me</code> is available on the backend.
        Phone number and constituency come from your authenticated session.
      </div>

      {savedMessage && (
        <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800">
          {savedMessage}
        </p>
      )}

      {error && (
        <p className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-800">
          {error}
        </p>
      )}

      <div className="overflow-hidden rounded-3xl border border-line/80 bg-white shadow-md">
        <div className={`border-b border-line/80 bg-gradient-to-r ${theme.sectionHeaderBg} px-5 py-4`}>
          <div className="flex items-center gap-4">
            <div className={`grid size-14 place-items-center rounded-2xl bg-gradient-to-br ${theme.avatarGradient} text-lg font-extrabold text-white shadow-lg`}>
              {profile.displayName.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="text-lg font-extrabold text-ink">{profile.displayName}</p>
              <p className="text-sm text-muted">+91 {profile.phone}</p>
              {profile.hasLocalEdits && (
                <span className="mt-1 inline-flex rounded-full bg-amber-100 px-2 py-0.5 text-[0.65rem] font-bold text-amber-800">
                  Local edits
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="divide-y divide-line/60">
          <ProfileSection title="Personal details">
            {isEditing ? (
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Display name">
                  <input
                    className="w-full rounded-xl border border-line px-3 py-2 text-sm font-semibold"
                    onChange={(e) => setForm((f) => f && { ...f, displayName: e.target.value })}
                    value={form.displayName}
                  />
                </Field>
                <Field label="Email (optional)">
                  <input
                    className="w-full rounded-xl border border-line px-3 py-2 text-sm font-semibold"
                    onChange={(e) => setForm((f) => f && { ...f, email: e.target.value })}
                    placeholder="you@example.com"
                    type="email"
                    value={form.email}
                  />
                </Field>
                <Field label="Preferred ward">
                  <select
                    className="w-full rounded-xl border border-line px-3 py-2 text-sm font-semibold"
                    onChange={(e) =>
                      setForm((f) =>
                        f
                          ? {
                              ...f,
                              wardId: e.target.value ? Number(e.target.value) : '',
                            }
                          : f,
                      )
                    }
                    value={form.wardId}
                  >
                    <option value="">Not set</option>
                    {wardOptions.map((ward) => (
                      <option key={ward.id} value={ward.id}>
                        {ward.name}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Language">
                  <select
                    className="w-full rounded-xl border border-line px-3 py-2 text-sm font-semibold"
                    onChange={(e) =>
                      setForm((f) => f && { ...f, locale: e.target.value as SupportedLocale })
                    }
                    value={form.locale}
                  >
                    {supportedLocales.map((loc) => (
                      <option key={loc} value={loc}>
                        {localeLabels[loc]}
                      </option>
                    ))}
                  </select>
                </Field>
              </div>
            ) : (
              <dl className="grid gap-4 sm:grid-cols-2">
                <ReadOnlyField label="Display name" value={profile.displayName} />
                <ReadOnlyField label="Email" value={profile.email || 'Not set'} />
                <ReadOnlyField label="Preferred ward" value={profile.wardName ?? 'Not set'} />
                <ReadOnlyField label="Language" value={profile.localeLabel} />
              </dl>
            )}
          </ProfileSection>

          <ProfileSection title="Account (read-only)">
            <dl className="grid gap-4 sm:grid-cols-2">
              {readOnlyFields.map((field) => (
                <ReadOnlyField key={field.label} label={field.label} value={field.value} />
              ))}
            </dl>
          </ProfileSection>

          <ProfileSection title="Notifications">
            {isEditing ? (
              <div className="space-y-3">
                <ToggleRow
                  checked={form.notifySms}
                  description="Status updates on complaints you filed"
                  label="SMS updates"
                  onChange={(checked) => setForm((f) => f && { ...f, notifySms: checked })}
                />
                <ToggleRow
                  checked={form.notifyEmail}
                  description="Requires an email address in your profile"
                  label="Email updates"
                  onChange={(checked) => setForm((f) => f && { ...f, notifyEmail: checked })}
                />
              </div>
            ) : (
              <dl className="grid gap-4 sm:grid-cols-2">
                <ReadOnlyField label="SMS updates" value={profile.notifySms ? 'Enabled' : 'Disabled'} />
                <ReadOnlyField label="Email updates" value={profile.notifyEmail ? 'Enabled' : 'Disabled'} />
              </dl>
            )}
          </ProfileSection>

          {profile.lastUpdated && (
            <div className="px-5 py-4 text-xs font-semibold text-muted">
              Last saved locally:{' '}
              {new Date(profile.lastUpdated).toLocaleString('en-IN', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </div>
          )}
        </div>
      </div>
    </section>
  )
}

function ProfileSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="px-5 py-5">
      <h2 className="text-xs font-bold uppercase tracking-[0.16em] text-muted">{title}</h2>
      <div className="mt-4">{children}</div>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-xs font-bold text-muted">{label}</span>
      <div className="mt-1">{children}</div>
    </label>
  )
}

function ReadOnlyField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-bold uppercase tracking-wide text-muted">{label}</dt>
      <dd className="mt-1 font-semibold text-ink">{value}</dd>
    </div>
  )
}

function ToggleRow({
  label,
  description,
  checked,
  onChange,
}: {
  label: string
  description: string
  checked: boolean
  onChange: (checked: boolean) => void
}) {
  return (
    <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-line/80 bg-slate-50/50 px-4 py-3">
      <input
        checked={checked}
        className="mt-1 size-4 rounded border-line text-teal-600"
        onChange={(e) => onChange(e.target.checked)}
        type="checkbox"
      />
      <span>
        <span className="block text-sm font-bold text-ink">{label}</span>
        <span className="mt-0.5 block text-xs text-muted">{description}</span>
      </span>
    </label>
  )
}
