import { useEffect, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { paths } from '@/app/router/paths'
import { ApiError } from '@/shared/api/types'
import { Button } from '@/shared/components/ui/Button'
import { Spinner } from '@/shared/components/ui/Spinner'
import { ResumePreview } from '../components/ResumePreview'
import { ResumeEditor } from '../editor/ResumeEditor'
import { useResume, useSaveResumeVersion } from '../hooks/useResumes'
import { PdfButton } from '../pdf/PdfButton'
import { parseResumeJson } from '../schema/validateResume'
import type { ResumeDocument } from '../types/resume'
import styles from './ResumeBuilderPage.module.css'

type EditorState = {
  resumeId: number
  versionId: number
  resume: ResumeDocument
  baseline: ResumeDocument
  draft: string
}

export function ResumeBuilderPage() {
  const params = useParams()
  const resumeId = Number(params.id)
  const validId = Number.isInteger(resumeId) && resumeId > 0
  const query = useResume(validId ? resumeId : Number.NaN)
  const saveVersion = useSaveResumeVersion(validId ? resumeId : 0)
  const pageRef = useRef<HTMLDivElement>(null)
  const [editor, setEditor] = useState<EditorState | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const data = query.data
    if (!data) {
      return
    }

    setEditor((current) => {
      if (current?.resumeId === data.id && current.versionId === data.currentVersion.id) {
        return current
      }

      return {
        resumeId: data.id,
        versionId: data.currentVersion.id,
        resume: data.currentVersion.content,
        baseline: data.currentVersion.content,
        draft: JSON.stringify(data.currentVersion.content, null, 2),
      }
    })
    setError(null)
  }, [query.data])

  const notFound =
    !validId || (query.isError && query.error instanceof ApiError && query.error.status === 404)

  if (notFound) {
    return (
      <section className={styles.page}>
        <p className={styles.kicker}>Resume</p>
        <h1 className={styles.title}>Resume not found</h1>
        <p className={styles.notice}>This resume is missing or you do not have access to it.</p>
        <Link className={styles.back} to={paths.resume}>
          All resumes
        </Link>
      </section>
    )
  }

  if (query.isError) {
    return (
      <section className={styles.page}>
        <p className={styles.error} role="alert">
          {query.error instanceof ApiError ? query.error.message : 'Could not load this resume.'}
        </p>
        <Link className={styles.back} to={paths.resume}>
          All resumes
        </Link>
      </section>
    )
  }

  if (query.isLoading || !editor || editor.resumeId !== resumeId) {
    return <Spinner page />
  }

  const dirty = JSON.stringify(editor.resume) !== JSON.stringify(editor.baseline)

  function handleResumeChange(next: ResumeDocument) {
    setError(null)
    setEditor((current) =>
      current
        ? {
            ...current,
            resume: next,
            draft: JSON.stringify(next, null, 2),
          }
        : current,
    )
  }

  function handleShowJson() {
    setError(null)
    setEditor((current) =>
      current
        ? {
            ...current,
            draft: JSON.stringify(current.resume, null, 2),
          }
        : current,
    )
  }

  function handleApply() {
    setEditor((current) => {
      if (!current) {
        return current
      }

      const result = parseResumeJson(current.draft)
      if (!result.ok) {
        setError(result.error)
        return current
      }

      setError(null)
      return {
        ...current,
        resume: result.resume,
        draft: JSON.stringify(result.resume, null, 2),
      }
    })
  }

  function handleReset() {
    setError(null)
    setEditor((current) =>
      current
        ? {
            ...current,
            resume: current.baseline,
            draft: JSON.stringify(current.baseline, null, 2),
          }
        : current,
    )
  }

  function handleSave() {
    if (!editor || !dirty) {
      return
    }

    setError(null)
    saveVersion.mutate(editor.resume, {
      onError: (caught) => {
        setError(caught instanceof ApiError ? caught.message : 'Could not save this resume.')
      },
    })
  }

  return (
    <section className={styles.page}>
      <header className={styles.header}>
        <div>
          <p className={styles.kicker}>Resume Builder</p>
          <h1 className={styles.title}>{query.data?.name ?? 'Resume editor'}</h1>
          <Link className={styles.back} to={paths.resume}>
            All resumes
          </Link>
        </div>
        <div className={styles.actions}>
          <Button onClick={handleSave} loading={saveVersion.isPending} disabled={!dirty}>
            Save
          </Button>
          <PdfButton targetRef={pageRef} resume={editor.resume} />
        </div>
      </header>

      {error ? (
        <p className={styles.error} role="alert">
          {error}
        </p>
      ) : null}
      {saveVersion.isSuccess && !dirty ? <p className={styles.saved}>Saved</p> : null}

      <div className={styles.workspace}>
        <ResumeEditor
          resume={editor.resume}
          draft={editor.draft}
          error={error}
          onResumeChange={handleResumeChange}
          onDraftChange={(draft) =>
            setEditor((current) => (current ? { ...current, draft } : current))
          }
          onShowJson={handleShowJson}
          onApplyJson={handleApply}
          onResetJson={handleReset}
        />
        <ResumePreview resume={editor.resume} pageRef={pageRef} />
      </div>
    </section>
  )
}
