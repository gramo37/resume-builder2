import type { ReactNode } from 'react'
import styles from './PageShell.module.css'

type PageShellProps = {
  kicker: string
  title: string
  children: ReactNode
}

export function PageShell({ kicker, title, children }: PageShellProps) {
  return (
    <section className={styles.page}>
      <p className={styles.kicker}>{kicker}</p>
      <h1 className={styles.title}>{title}</h1>
      <div className={styles.card}>
        <div className={styles.copy}>{children}</div>
      </div>
    </section>
  )
}
