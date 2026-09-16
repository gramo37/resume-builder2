import { useQuery } from '@tanstack/react-query'
import { useEffect } from 'react'
import { authApi } from '../api/auth.api'
import { authKeys } from '../api/auth.keys'
import { useAuthStore } from '../store/auth.store'

export function useCurrentUser() {
  const accessToken = useAuthStore((state) => state.tokens?.accessToken)
  const user = useAuthStore((state) => state.user)
  const setUser = useAuthStore((state) => state.setUser)

  const query = useQuery({
    queryKey: authKeys.me(),
    queryFn: authApi.me,
    enabled: Boolean(accessToken),
  })

  useEffect(() => {
    if (query.data) {
      setUser(query.data)
    }
  }, [query.data, setUser])

  return {
    ...query,
    user: query.data ?? user,
  }
}
