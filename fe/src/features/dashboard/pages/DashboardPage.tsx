import { useCurrentUser } from '@/features/auth/hooks/useCurrentUser'
import { useLogout } from '@/features/auth/hooks/useLogout'
import { Button } from '@/shared/components/ui/Button'
import { Spinner } from '@/shared/components/ui/Spinner'
import styles from './DashboardPage.module.css'

export function DashboardPage() {
  const { user, isLoading } = useCurrentUser()
  const logout = useLogout()

  if (isLoading && !user) {
    return <Spinner page />
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <p className={styles.logo}>Applyant</p>
        <div className={styles.headerActions}>
          <span className={styles.email}>{user?.email}</span>
          <Button variant="secondary" onClick={() => logout.mutate()} loading={logout.isPending}>
            Sign out
          </Button>
        </div>
      </header>

      <main className={styles.main}>
        <section className={styles.card}>
          <p className={styles.kicker}>Dashboard</p>
          <h1 className={styles.title}>Welcome{user?.name ? `, ${user.name}` : ''}.</h1>
          <p className={styles.copy}>
            This is a protected route. You are signed in and can start adding application
            workflows here.
          </p>
        </section>
      </main>
    </div>
  )
}
