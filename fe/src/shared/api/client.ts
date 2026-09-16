import { useAuthStore } from '@/features/auth/store/auth.store'
import type { AuthResult } from '@/features/auth/types'
import { env } from '@/shared/config/env'
import { ApiError, type ApiResponse } from './types'

type RequestOptions = {
  skipAuth?: boolean
  skipRefresh?: boolean
}

type RequestConfig = RequestOptions & {
  method: 'GET' | 'POST'
  body?: unknown
}

let refreshPromise: Promise<boolean> | null = null

function toUrl(path: string): string {
  return `${env.apiBaseUrl}${path}`
}

async function parseBody<T>(response: Response): Promise<T> {
  const payload = (await response.json().catch(() => null)) as ApiResponse<T> | null

  if (!payload) {
    throw new ApiError(response.statusText || 'Request failed', response.status)
  }

  if (!response.ok || !payload.success) {
    throw new ApiError(
      'message' in payload ? payload.message : 'Request failed',
      response.status,
    )
  }

  return payload.data
}

async function refreshSession(): Promise<boolean> {
  if (refreshPromise) {
    return refreshPromise
  }

  refreshPromise = (async () => {
    const { user, tokens, setSession, clearSession } = useAuthStore.getState()

    if (!user?.email || !tokens?.refreshToken) {
      clearSession()
      return false
    }

    try {
      const data = await request<AuthResult>('/api/auth/refresh', {
        method: 'POST',
        body: {
          email: user.email,
          refreshToken: tokens.refreshToken,
        },
        skipAuth: true,
        skipRefresh: true,
      })

      setSession(data)
      return true
    } catch {
      clearSession()
      return false
    }
  })()

  try {
    return await refreshPromise
  } finally {
    refreshPromise = null
  }
}

async function request<T>(path: string, config: RequestConfig): Promise<T> {
  const headers = new Headers({
    Accept: 'application/json',
  })

  if (config.body !== undefined) {
    headers.set('Content-Type', 'application/json')
  }

  const accessToken = useAuthStore.getState().tokens?.accessToken
  if (!config.skipAuth && accessToken) {
    headers.set('Authorization', `Bearer ${accessToken}`)
  }

  const response = await fetch(toUrl(path), {
    method: config.method,
    headers,
    body: config.body === undefined ? undefined : JSON.stringify(config.body),
  })

  if (response.status === 401 && !config.skipRefresh) {
    const refreshed = await refreshSession()
    if (refreshed) {
      return request<T>(path, { ...config, skipRefresh: true })
    }
  }

  return parseBody<T>(response)
}

export const apiClient = {
  get<T>(path: string, options: RequestOptions = {}) {
    return request<T>(path, { ...options, method: 'GET' })
  },
  post<T>(path: string, body?: unknown, options: RequestOptions = {}) {
    return request<T>(path, { ...options, method: 'POST', body })
  },
}
