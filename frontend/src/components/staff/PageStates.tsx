type Props = {
  message?: string
}

export function PageLoading({ message = 'Loading…' }: Props) {
  return (
    <div className="flex min-h-[20rem] flex-col items-center justify-center rounded-3xl border border-dashed border-slate-300/80 bg-white/80 p-8 text-center shadow-sm">
      <div className="size-10 animate-spin rounded-full border-4 border-primary/20 border-t-primary" />
      <p className="mt-4 text-sm font-semibold text-muted">{message}</p>
    </div>
  )
}

type ErrorProps = {
  title?: string
  message: string
  onRetry?: () => void
}

export function PageError({ title = 'Could not load data', message, onRetry }: ErrorProps) {
  return (
    <div className="flex min-h-[20rem] flex-col items-center justify-center rounded-3xl border border-red-200 bg-red-50/80 p-8 text-center shadow-sm">
      <p className="text-lg font-extrabold text-red-800">{title}</p>
      <p className="mt-2 max-w-md text-sm text-red-700">{message}</p>
      {onRetry && (
        <button
          className="mt-4 rounded-full bg-primary px-5 py-2.5 text-sm font-extrabold text-white shadow-md transition hover:bg-primary-dark"
          onClick={onRetry}
          type="button"
        >
          Try again
        </button>
      )}
    </div>
  )
}

type HeaderProps = {
  eyebrow: string
  title: string
  description?: string
}

export function PageHeader({ eyebrow, title, description }: HeaderProps) {
  return (
    <div className="overflow-hidden rounded-3xl border border-line/80 bg-white shadow-md">
      <div className="border-b border-line/80 bg-gradient-to-r from-slate-50 to-white px-5 py-4 sm:px-6">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-accent">{eyebrow}</p>
        <h1 className="mt-1 text-2xl font-extrabold">{title}</h1>
        {description && <p className="mt-2 text-sm text-muted">{description}</p>}
      </div>
    </div>
  )
}
