import { useState } from 'react'
import { env } from '@/shared/config/env'
import type { ResumeDocument } from '../types/resume'
import { ContentEditor } from './ContentEditor'
import { JsonEditor } from './JsonEditor'
import { ThemeEditor } from './ThemeEditor'
import styles from './ResumeEditor.module.css'

type EditorTab = 'content' | 'theme' | 'json'

type ResumeEditorProps = {
  resume: ResumeDocument
  draft: string
  error: string | null
  onResumeChange: (resume: ResumeDocument) => void
  onDraftChange: (draft: string) => void
  onShowJson: () => void
  onApplyJson: () => void
  onResetJson: () => void
}

export function ResumeEditor({
  resume,
  draft,
  error,
  onResumeChange,
  onDraftChange,
  onShowJson,
  onApplyJson,
  onResetJson,
}: ResumeEditorProps) {
  const [tab, setTab] = useState<EditorTab>('content')
  const tabs: { id: EditorTab; label: string }[] = [
    { id: 'content', label: 'Content' },
    { id: 'theme', label: 'Theme' },
  ]
  if (env.showJsonEditor) {
    tabs.push({ id: 'json', label: 'JSON' })
  }

  function selectTab(next: EditorTab) {
    if (next === 'json') {
      onShowJson()
    }
    setTab(next)
  }

  return (
    <div className={styles.shell}>
      <div className={styles.tabs} role="tablist" aria-label="Resume editor">
        {tabs.map((item) => (
          <button
            key={item.id}
            type="button"
            role="tab"
            id={`resume-tab-${item.id}`}
            className={tab === item.id ? styles.tabActive : styles.tab}
            aria-selected={tab === item.id}
            aria-controls={`resume-panel-${item.id}`}
            onClick={() => selectTab(item.id)}
          >
            {item.label}
          </button>
        ))}
      </div>

      {tab === 'content' ? (
        <div className={styles.panel} role="tabpanel" id="resume-panel-content" aria-labelledby="resume-tab-content">
          <ContentEditor resume={resume} onChange={onResumeChange} />
        </div>
      ) : null}

      {tab === 'theme' ? (
        <div className={styles.panel} role="tabpanel" id="resume-panel-theme" aria-labelledby="resume-tab-theme">
          <ThemeEditor resume={resume} onChange={onResumeChange} />
        </div>
      ) : null}

      {tab === 'json' && env.showJsonEditor ? (
        <div className={styles.jsonPanel} role="tabpanel" id="resume-panel-json" aria-labelledby="resume-tab-json">
          <JsonEditor value={draft} error={error} onChange={onDraftChange} onApply={onApplyJson} onReset={onResetJson} />
        </div>
      ) : null}
    </div>
  )
}
