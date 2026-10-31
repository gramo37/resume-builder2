import { LoginForm } from '../components/LoginForm'
import styles from './LoginPage.module.css'

export function LoginPage() {
  return (
    <main className={styles.page}>
      <section className={styles.brand}>
        <div className={styles.brandInner}>
          <p className={styles.kicker}>Applyant</p>
          <h1 className={styles.headline}>A quieter way to run your job search.</h1>
          <p className={styles.copy}>
            Sign in to keep applications, follow-ups, and next steps in one place.
          </p>
        </div>
      </section>

      <section className={styles.panel}>
        <div className={styles.card}>
          <p className={styles.cardKicker}>Welcome back</p>
          <h2 className={styles.cardTitle}>Sign in to your account</h2>
          <LoginForm />
        </div>
      </section>
    </main>
  )
}
