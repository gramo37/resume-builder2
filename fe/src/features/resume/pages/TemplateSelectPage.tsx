import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { paths } from '@/app/router/paths'
import { ApiError } from '@/shared/api/types'
import { Button } from '@/shared/components/ui/Button'
import { Input } from '@/shared/components/ui/Input'
import { Spinner } from '@/shared/components/ui/Spinner'
import { useCreateResume, useResumeTemplates } from '../hooks/useResumes'
import styles from './TemplateSelectPage.module.css'

const DEFAULT_NAME = 'Untitled resume'

export function TemplateSelectPage() {
  const navigate = useNavigate()
  const templates = useResumeTemplates()
  const createResume = useCreateResume()
  const [name, setName] = useState(DEFAULT_NAME)
  const [nameError, setNameError] = useState<string | null>(null)

  function chooseTemplate(templateId: number) {
    const trimmed = name.trim()
    if (!trimmed) {
      setNameError('Name is required')
      return
    }

    setNameError(null)
    createResume.mutate(
      { name: trimmed, templateId },
      {
        onSuccess: (resume) => {
          void navigate(paths.resumeEditor(resume.id))
        },
      },
    )
  }

  return (
    <section className={styles.page}>
      <header className={styles.header}>
        <div>
          <p className={styles.kicker}>New resume</p>
          <h1 className={styles.title}>Choose a template</h1>
        </div>
        <Link className={styles.back} to={paths.resume}>
          All resumes
        </Link>
      </header>

      <Input
        label="Resume name"
        value={name}
        error={nameError ?? undefined}
        onChange={(event) => {
          setName(event.target.value)
          if (nameError) {
            setNameError(null)
          }
        }}
      />

      {templates.isLoading ? <Spinner page /> : null}

      {templates.isError ? (
        <p className={styles.error} role="alert">
          {templates.error instanceof ApiError ? templates.error.message : 'Could not load templates.'}
        </p>
      ) : null}

      {createResume.isError ? (
        <p className={styles.error} role="alert">
          {createResume.error instanceof ApiError
            ? createResume.error.message
            : 'Could not create the resume.'}
        </p>
      ) : null}

      {templates.data ? (
        <ul className={styles.grid}>
          {templates.data.templates.map((template) => {
            const creating =
              createResume.isPending && createResume.variables?.templateId === template.id

            return (
              <li key={template.id} className={styles.card}>
                <h2 className={styles.cardTitle}>{template.name}</h2>
                <p className={styles.description}>{template.description}</p>
                <Button
                  onClick={() => chooseTemplate(template.id)}
                  loading={creating}
                  disabled={createResume.isPending && !creating}
                >
                  Use template
                </Button>
              </li>
            )
          })}
        </ul>
      ) : null}
    </section>
  )
}
