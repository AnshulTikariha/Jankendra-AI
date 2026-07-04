import type { UserRole } from '../../types/auth'

export type ApiUser = {
  id: string
  phone: string
  full_name: string
  role: UserRole
  is_active: boolean
  constituency_name: string
}

export type OtpRequestResponse = {
  message: string
  phone: string
  expires_in_seconds: number
  dev_otp?: string | null
}

export type TokenResponse = {
  access_token: string
  token_type: string
  user: ApiUser
}
