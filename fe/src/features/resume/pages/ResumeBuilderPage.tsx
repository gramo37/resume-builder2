import { useRef, useState } from 'react'
import { ResumePreview } from '../components/ResumePreview'
import { sampleResume, sampleResumeSource } from '../data/sampleResume'
import { ResumeEditor } from '../editor/ResumeEditor'
import { PdfButton } from '../pdf/PdfButton'
import type { ResumeDocument } from '../types/resume'
import { parseResumeJson } from '../schema/validateResume'
import styles from './ResumeBuilderPage.module.css'

const sampleJson = JSON.stringify(sampleResumeSource, null, 2)

export function ResumeBuilderPage() {
  const pageRef = useRef<HTMLDivElement>(null)
  const [draft, setDraft] = useState(sampleJson)
  const [resume, setResume] = useState<ResumeDocument>(sampleResume)
  const [error, setError] = useState<string | null>(null)

  function handleResumeChange(next: ResumeDocument) {
    setError(null)
    setResume(next)
    setDraft(JSON.stringify(next, null, 2))
  }

  function handleShowJson() {
    setError(null)
    setDraft(JSON.stringify(resume, null, 2))
  }

  function handleApply() {
    const result = parseResumeJson(draft)
    if (!result.ok) {
      setError(result.error)
      return
    }

    setError(null)
    setResume(result.resume)
    setDraft(JSON.stringify(result.resume, null, 2))
  }

  function handleReset() {
    setDraft(sampleJson)
    setResume(sampleResume)
    setError(null)
  }

  return (
    <section className={styles.page}>
      <header className={styles.header}>
        <div>
          <p className={styles.kicker}>Resume Builder</p>
          <h1 className={styles.title}>Resume editor</h1>
        </div>
        <PdfButton targetRef={pageRef} resume={resume} />
      </header>

      <div className={styles.workspace}>
        <ResumeEditor
          resume={resume}
          draft={draft}
          error={error}
          onResumeChange={handleResumeChange}
          onDraftChange={setDraft}
          onShowJson={handleShowJson}
          onApplyJson={handleApply}
          onResetJson={handleReset}
        />
        <ResumePreview resume={resume} pageRef={pageRef} />
      </div>
    </section>
  )
}
