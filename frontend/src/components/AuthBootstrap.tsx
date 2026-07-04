import { useEffect, useState, type ReactNode } from 'react'
import { fetchMe } from '../api/auth'
import { ApiError } from '../api/errors'
import { mapUserToSession } from '../lib/authMappers'
import { useAuthStore } from '../stores/useAuthStore'

type Props = {
  children: ReactNode
}

export function AuthBootstrap({ children }: Props) {
  const session = useAuthStore((s) => s.session)
  const logout = useAuthStore((s) => s.logout)
  const setSession = useAuthStore((s) => s.setSession)
  const [ready, setReady] = useState(() => !session?.accessToken)

  useEffect(() => {
    if (!session?.accessToken) {
      setReady(true)
      return
    }

    let cancelled = false

    fetchMe(session.accessToken)
      .then((user) => {
        if (cancelled) return
        setSession(mapUserToSession(user, session.accessToken))
        setReady(true)
      })
      .catch((error: unknown) => {
        if (cancelled) return
        if (error instanceof ApiError && error.status === 401) {
          logout()
        }
        setReady(true)
      })

    return () => {
      cancelled = true
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps -- run once on mount

  if (!ready) {
    return (
      <div className="grid min-h-svh place-items-center bg-slate-50 text-sm font-semibold text-muted">
        Restoring session…
      </div>
    )
  }

  return children
}
