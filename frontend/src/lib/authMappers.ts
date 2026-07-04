import type { ApiUser, TokenResponse } from '../api/types/auth'
import type { AuthSession } from '../types/auth'

export function mapUserToSession(user: ApiUser, accessToken: string): AuthSession {
  return {
    userId: user.id,
    accessToken,
    role: user.role,
    phone: user.phone,
    name: user.full_name,
    constituencyName: user.constituency_name,
  }
}

export function mapTokenResponse(response: TokenResponse): AuthSession {
  return mapUserToSession(response.user, response.access_token)
}
