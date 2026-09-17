import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { paths } from '@/app/router/paths'
import { authApi } from '../api/auth.api'
import { authKeys } from '../api/auth.keys'
import { useAuthStore } from '../store/auth.store'

export function useLogin() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const setSession = useAuthStore((state) => state.setSession)

  return useMutation({
    mutationFn: authApi.login,
    onSuccess: (data) => {
      setSession(data)
      queryClient.setQueryData(authKeys.me(), data.user)
      void navigate(paths.home, { replace: true })
    },
  })
}
