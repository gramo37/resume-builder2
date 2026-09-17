import { Navigate, Outlet } from 'react-router-dom'
import { selectIsAuthenticated, useAuthStore } from '@/features/auth/store/auth.store'
import { Spinner } from '@/shared/components/ui/Spinner'
import { paths } from './paths'

export function GuestRoute() {
  const hasHydrated = useAuthStore((state) => state.hasHydrated)
  const isAuthenticated = useAuthStore(selectIsAuthenticated)

  if (!hasHydrated) {
    return <Spinner page />
  }

  if (isAuthenticated) {
    return <Navigate to={paths.home} replace />
  }

  return <Outlet />
}
