import { createBrowserRouter, Navigate } from 'react-router-dom'
import { AppLayout } from '@/app/layouts/AppLayout'
import { LoginPage } from '@/features/auth/pages/LoginPage'
import { AutomationsPage } from '@/features/automations/pages/AutomationsPage'
import { HomePage } from '@/features/home/pages/HomePage'
import { IntegrationsPage } from '@/features/integrations/pages/IntegrationsPage'
import { JobsPage } from '@/features/jobs/pages/JobsPage'
import { PeoplePage } from '@/features/people/pages/PeoplePage'
import { ResumeBuilderPage } from '@/features/resume/pages/ResumeBuilderPage'
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
        element: <AppLayout />,
        children: [
          {
            path: paths.home,
            element: <HomePage />,
          },
          {
            path: paths.automations,
            element: <AutomationsPage />,
          },
          {
            path: paths.jobs,
            element: <JobsPage />,
          },
          {
            path: paths.people,
            element: <PeoplePage />,
          },
          {
            path: paths.integrations,
            element: <IntegrationsPage />,
          },
          {
            path: paths.resume,
            element: <ResumeBuilderPage />,
          },
        ],
      },
    ],
  },
  {
    path: paths.root,
    element: <Navigate to={paths.home} replace />,
  },
  {
    path: '*',
    element: <Navigate to={paths.home} replace />,
  },
])
