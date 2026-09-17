import { useEffect, useState } from 'react'
import { Outlet } from 'react-router-dom'
import { MenuIcon } from '@/shared/components/layout/icons'
import { Sidebar } from '@/shared/components/layout/Sidebar'
import styles from './AppLayout.module.css'

export function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => {
    if (!sidebarOpen) {
      return
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setSidebarOpen(false)
      }
    }

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', onKeyDown)

    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [sidebarOpen])

  return (
    <div className={styles.shell}>
      {sidebarOpen ? (
        <button
          type="button"
          className={styles.overlay}
          aria-label="Close menu"
          onClick={() => setSidebarOpen(false)}
        />
      ) : null}

      <Sidebar open={sidebarOpen} onNavigate={() => setSidebarOpen(false)} />

      <div className={styles.main}>
        <header className={styles.mobileBar}>
          <button
            type="button"
            className={styles.menuButton}
            aria-label="Open menu"
            aria-expanded={sidebarOpen}
            onClick={() => setSidebarOpen(true)}
          >
            <MenuIcon />
          </button>
          <p className={styles.mobileLogo}>Applyant</p>
        </header>

        <main className={styles.content}>
          <Outlet />
        </main>
      </div>
    </div>
  )
}
