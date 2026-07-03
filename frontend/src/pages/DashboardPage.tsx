import { apiBaseUrl } from '../api/httpClient'

const scaffoldCards = [
  {
    title: 'Stack',
    value: 'React + TypeScript + Tailwind',
    detail: 'Vite development server with fast HMR.',
  },
  {
    title: 'Server State',
    value: 'TanStack Query',
    detail: 'Provider is mounted at the React root.',
  },
  {
    title: 'Client State',
    value: 'Zustand',
    detail: 'UI shell state is ready for route selection.',
  },
]

export function DashboardPage() {
  return (
    <section className="space-y-6">
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.24em] text-emerald-700">
          Blank app loads
        </p>
        <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">
          Frontend foundation is ready for Phase 1 workflows.
        </h2>
        <p className="mt-4 max-w-3xl text-base leading-7 text-slate-600">
          This shell follows the architecture document by setting up the React
          frontend layer, planned feature areas, API integration surface, and
          state management foundations.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {scaffoldCards.map((card) => (
          <article
            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
            key={card.title}
          >
            <p className="text-sm font-medium text-slate-500">{card.title}</p>
            <h3 className="mt-2 text-xl font-semibold text-slate-950">
              {card.value}
            </h3>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              {card.detail}
            </p>
          </article>
        ))}
      </div>

      <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-5">
        <p className="text-sm font-medium text-slate-700">API base URL</p>
        <code className="mt-2 inline-flex rounded-lg bg-slate-900 px-3 py-2 text-sm text-white">
          {apiBaseUrl}
        </code>
      </div>
    </section>
  )
}
