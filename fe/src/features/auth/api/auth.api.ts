import { apiClient } from '@/shared/api/client'
import type { AuthResult, AuthUser, LoginInput } from '../types'

export const authApi = {
  login(input: LoginInput) {
    return apiClient.post<AuthResult>('/api/auth/login', input, { skipAuth: true })
  },
  me() {
    return apiClient.get<AuthUser>('/api/auth/me')
  },
  logout() {
    return apiClient.post<{ signedOut: true }>('/api/auth/logout')
  },
}
