import { useState, type RefObject } from 'react'
import { Button } from '@/shared/components/ui/Button'
import type { ResumeDocument } from '../types/resume'
import styles from './PdfButton.module.css'

type PdfButtonProps = {
  targetRef: RefObject<HTMLElement | null>
  resume: ResumeDocument
}

export function PdfButton({ targetRef, resume }: PdfButtonProps) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleDownload() {
    const node = targetRef.current
    if (!node) {
      setError('Resume preview is not ready yet.')
      return
    }

    setBusy(true)
    setError(null)

    try {
      const { downloadResumePdf, resumePdfFilename } = await import('../utils/pdf')
      await downloadResumePdf(node, resumePdfFilename(resume), resume.template.page)
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Could not create the PDF.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className={styles.wrap}>
      <Button onClick={() => void handleDownload()} loading={busy}>
        Download PDF
      </Button>
      {error ? (
        <p className={styles.error} role="alert">
          {error}
        </p>
      ) : null}
    </div>
  )
}
