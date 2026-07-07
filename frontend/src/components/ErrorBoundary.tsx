import { Component, type ErrorInfo, type ReactNode } from 'react'

type Props = {
  children: ReactNode
  label?: string
}

type State = {
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error(`[${this.props.label ?? 'app'}]`, error, info.componentStack)
  }

  render() {
    if (this.state.error) {
      return (
        <div className="flex min-h-[16rem] flex-col items-center justify-center rounded-3xl border border-red-200 bg-red-50 p-8 text-center">
          <p className="text-lg font-extrabold text-red-800">Something went wrong</p>
          <p className="mt-2 max-w-md text-sm text-red-700">
            {this.props.label ? `${this.props.label} could not be displayed. ` : ''}
            Try refreshing the page. If it keeps happening, sign out and sign in again.
          </p>
          <button
            className="mt-4 rounded-full bg-teal-600 px-5 py-2.5 text-sm font-extrabold text-white"
            onClick={() => window.location.reload()}
            type="button"
          >
            Refresh page
          </button>
        </div>
      )
    }

    return this.props.children
  }
}
