import { createBrowserRouter, Navigate } from 'react-router-dom'
import { LoginPage } from '@/features/auth/pages/LoginPage'
import { DashboardPage } from '@/features/dashboard/pages/DashboardPage'
import { GuestRoute } from './GuestRoute'
import { paths } from './paths'
import { ProtectedRoute } from './ProtectedRoute'

export const router = createBrowserRouter([
  {
    element: <GuestRoute />,
    children: [
      {
        path: paths.login,
        element: <LoginPage />,
      },
    ],
  },
  {
    element: <ProtectedRoute />,
    children: [
      {
        path: paths.dashboard,
        element: <DashboardPage />,
      },
    ],
  },
  {
    path: paths.root,
    element: <Navigate to={paths.dashboard} replace />,
  },
  {
    path: '*',
    element: <Navigate to={paths.dashboard} replace />,
  },
])
