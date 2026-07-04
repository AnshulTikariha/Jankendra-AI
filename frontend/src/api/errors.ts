export class ApiError extends Error {
  status: number
  detail: unknown

  constructor(message: string, status: number, detail?: unknown) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.detail = detail
  }
}

export function parseApiErrorDetail(body: unknown): string | null {
  if (!body || typeof body !== 'object') return null

  const detail = (body as { detail?: unknown }).detail

  if (typeof detail === 'string') return detail

  if (Array.isArray(detail) && detail.length > 0) {
    const first = detail[0]
    if (first && typeof first === 'object' && 'msg' in first) {
      return String((first as { msg: unknown }).msg)
    }
  }

  return null
}
