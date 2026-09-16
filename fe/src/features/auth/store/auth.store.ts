import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { AuthResult, AuthUser, CognitoAuthTokens } from '../types'

type AuthState = {
  user: AuthUser | null
  tokens: CognitoAuthTokens | null
  hasHydrated: boolean
  setSession: (session: AuthResult) => void
  setUser: (user: AuthUser) => void
  clearSession: () => void
  setHasHydrated: (hasHydrated: boolean) => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      tokens: null,
      hasHydrated: false,
      setSession: (session) => set({ user: session.user, tokens: session.tokens }),
      setUser: (user) => set({ user }),
      clearSession: () => set({ user: null, tokens: null }),
      setHasHydrated: (hasHydrated) => set({ hasHydrated }),
    }),
    {
      name: 'applyant.auth',
      partialize: (state) => ({
        user: state.user,
        tokens: state.tokens,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true)
      },
    },
  ),
)

useAuthStore.persist.onFinishHydration(() => {
  useAuthStore.getState().setHasHydrated(true)
})

if (useAuthStore.persist.hasHydrated()) {
  useAuthStore.getState().setHasHydrated(true)
}

export function selectIsAuthenticated(state: AuthState): boolean {
  return Boolean(state.tokens?.accessToken)
}
