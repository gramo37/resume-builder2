import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { paths } from '@/app/router/paths'
import { authApi } from '../api/auth.api'
import { useAuthStore } from '../store/auth.store'

export function useLogout() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const clearSession = useAuthStore((state) => state.clearSession)

  return useMutation({
    mutationFn: authApi.logout,
    onSettled: () => {
      clearSession()
      queryClient.clear()
      void navigate(paths.login, { replace: true })
    },
  })
}
