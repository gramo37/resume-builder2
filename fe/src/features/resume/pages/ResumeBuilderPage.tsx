import { useRef, useState } from 'react'
import { ResumePreview } from '../components/ResumePreview'
import { sampleResume, sampleResumeSource } from '../data/sampleResume'
import { JsonEditor } from '../editor/JsonEditor'
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

  function handleApply() {
    const result = parseResumeJson(draft)
    if (!result.ok) {
      setError(result.error)
      return
    }

    setError(null)
    setResume(result.resume)
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
          <h1 className={styles.title}>JSON to A4 resume</h1>
        </div>
        <PdfButton targetRef={pageRef} resume={resume} />
      </header>

      <div className={styles.workspace}>
        <JsonEditor
          value={draft}
          error={error}
          onChange={setDraft}
          onApply={handleApply}
          onReset={handleReset}
        />
        <ResumePreview resume={resume} pageRef={pageRef} />
      </div>
    </section>
  )
}
