import { apiFetch } from './httpClient'
import type { OtpRequestResponse, TokenResponse, ApiUser } from './types/auth'
import type { UserRole } from '../types/auth'

export function requestOtp(phone: string): Promise<OtpRequestResponse> {
  return apiFetch<OtpRequestResponse>('/auth/otp/request', {
    method: 'POST',
    body: JSON.stringify({ phone }),
  })
}

export function verifyOtp(
  phone: string,
  otp: string,
  role: UserRole,
): Promise<TokenResponse> {
  return apiFetch<TokenResponse>('/auth/otp/verify', {
    method: 'POST',
    body: JSON.stringify({ phone, otp, role }),
  })
}

export function fetchMe(token: string): Promise<ApiUser> {
  return apiFetch<ApiUser>('/auth/me', { token })
}
