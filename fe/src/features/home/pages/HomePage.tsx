import { useCurrentUser } from '@/features/auth/hooks/useCurrentUser'
import { PageShell } from '@/shared/components/layout/PageShell'
import { Spinner } from '@/shared/components/ui/Spinner'

export function HomePage() {
  const { user, isLoading } = useCurrentUser()

  if (isLoading && !user) {
    return <Spinner />
  }

  return (
    <PageShell kicker="Home" title={`Welcome${user?.name ? `, ${user.name}` : ''}.`}>
      <p>
        This is your starting point. Use the sidebar to move between automations, jobs, people,
        and integrations as you build out your search.
      </p>
    </PageShell>
  )
}
