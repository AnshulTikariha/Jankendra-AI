import { ApiError, parseApiErrorDetail } from './errors'

export const apiBaseUrl =
  import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, '') ?? '/api/v1'

type ApiFetchOptions = RequestInit & {
  token?: string | null
}

export async function apiFetch<TResponse>(
  path: string,
  init?: ApiFetchOptions,
): Promise<TResponse> {
  const { token, ...requestInit } = init ?? {}
  const headers = new Headers(requestInit.headers)

  if (!headers.has('Content-Type') && requestInit.body) {
    headers.set('Content-Type', 'application/json')
  }

  if (token) {
    headers.set('Authorization', `Bearer ${token}`)
  }

  const response = await fetch(`${apiBaseUrl}${path}`, {
    ...requestInit,
    headers,
  })

  if (response.status === 204) {
    return undefined as TResponse
  }

  const body = await response.json().catch(() => null)

  if (!response.ok) {
    const message =
      parseApiErrorDetail(body) ??
      `Request failed with status ${response.status}`
    throw new ApiError(message, response.status, body)
  }

  return body as TResponse
}
