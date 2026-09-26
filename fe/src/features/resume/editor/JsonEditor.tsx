import { Button } from '@/shared/components/ui/Button'
import styles from './JsonEditor.module.css'

type JsonEditorProps = {
  value: string
  error: string | null
  onChange: (value: string) => void
  onApply: () => void
  onReset: () => void
}

export function JsonEditor({ value, error, onChange, onApply, onReset }: JsonEditorProps) {
  return (
    <div className={styles.editor}>
      <div className={styles.toolbar}>
        <p className={styles.label}>Resume JSON</p>
        <div className={styles.actions}>
          <Button variant="secondary" onClick={onReset}>
            Reset
          </Button>
          <Button onClick={onApply}>Apply JSON</Button>
        </div>
      </div>
      {error ? (
        <p className={styles.error} role="alert">
          {error}
        </p>
      ) : null}
      <textarea
        className={styles.textarea}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        spellCheck={false}
        aria-label="Resume JSON"
      />
    </div>
  )
}
