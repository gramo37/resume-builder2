import { Link, useNavigate } from 'react-router-dom'
import { paths } from '@/app/router/paths'
import { Button } from '@/shared/components/ui/Button'
import { Spinner } from '@/shared/components/ui/Spinner'
import { ApiError } from '@/shared/api/types'
import { useResumeList } from '../hooks/useResumes'
import styles from './ResumeListPage.module.css'

export function ResumeListPage() {
  const navigate = useNavigate()
  const resumes = useResumeList()

  return (
    <section className={styles.page}>
      <header className={styles.header}>
        <div>
          <p className={styles.kicker}>Resumes</p>
          <h1 className={styles.title}>Your resumes</h1>
        </div>
        <Button onClick={() => navigate(paths.resumeTemplate)}>Create new resume</Button>
      </header>

      {resumes.isLoading ? <Spinner page /> : null}

      {resumes.isError ? (
        <p className={styles.error} role="alert">
          {resumes.error instanceof ApiError ? resumes.error.message : 'Could not load resumes.'}
        </p>
      ) : null}

      {resumes.data && resumes.data.resumes.length === 0 ? (
        <div className={styles.empty}>
          <p>You do not have a resume yet.</p>
          <Button onClick={() => navigate(paths.resumeTemplate)}>Create new resume</Button>
        </div>
      ) : null}

      {resumes.data && resumes.data.resumes.length > 0 ? (
        <ul className={styles.list}>
          {resumes.data.resumes.map((resume) => (
            <li key={resume.id}>
              <Link className={styles.row} to={paths.resumeEditor(resume.id)}>
                <span className={styles.name}>{resume.name}</span>
                <span className={styles.meta}>Updated {formatUpdated(resume.updatedAt)}</span>
              </Link>
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  )
}

function formatUpdated(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return value
  }
  return date.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })
}
