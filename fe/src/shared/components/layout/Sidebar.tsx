import { NavLink } from 'react-router-dom'
import { sidebarNav } from '@/app/layouts/nav'
import { useCurrentUser } from '@/features/auth/hooks/useCurrentUser'
import { useLogout } from '@/features/auth/hooks/useLogout'
import { cn } from '@/shared/lib/cn'
import { SidebarIcon } from './icons'
import styles from './Sidebar.module.css'

type SidebarProps = {
  open: boolean
  onNavigate: () => void
}

export function Sidebar({ open, onNavigate }: SidebarProps) {
  const { user } = useCurrentUser()
  const logout = useLogout()

  return (
    <aside className={cn(styles.sidebar, open && styles.open)} aria-label="Sidebar">
      <div className={styles.brand}>
        <p className={styles.logo}>Applyant</p>
        <span className={styles.mark}>Search</span>
      </div>

      <nav className={styles.nav} aria-label="Main">
        {sidebarNav.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) => cn(styles.link, isActive && styles.active)}
            onClick={onNavigate}
          >
            <SidebarIcon name={item.icon} />
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className={styles.footer}>
        <div className={styles.user}>
          <p className={styles.userName}>{user?.name ?? 'Signed in'}</p>
          <p className={styles.userEmail}>{user?.email}</p>
        </div>
        <button
          type="button"
          className={styles.signOut}
          onClick={() => logout.mutate()}
          disabled={logout.isPending}
        >
          {logout.isPending ? 'Signing out...' : 'Sign out'}
        </button>
      </div>
    </aside>
  )
}
