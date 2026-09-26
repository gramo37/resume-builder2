import { useMemo, type CSSProperties, type Ref } from 'react'
import type { ResumeDocument } from '../types/resume'
import { resolveLayout } from '../resolve/layout'
import { pageDimensions } from '../utils/pageSize'
import { fontFamily } from '../utils/styleToCss'
import { LayoutView } from './LayoutView'
import styles from './ResumeRenderer.module.css'

type ResumeRendererProps = {
  resume: ResumeDocument
  pageRef?: Ref<HTMLDivElement>
}

export function ResumeRenderer({ resume, pageRef }: ResumeRendererProps) {
  const resolved = useMemo(() => {
    try {
      return { layout: resolveLayout(resume), error: null }
    } catch (error) {
      return {
        layout: null,
        error: error instanceof Error ? error.message : 'Could not render this resume.',
      }
    }
  }, [resume])

  const { widthMm, heightMm } = pageDimensions(resume.template.page)
  const margin = resume.template.page.margin
  const theme = resume.template.theme
  const body = theme.typography?.body

  const pageStyle = {
    width: `${widthMm}mm`,
    minHeight: `${heightMm}mm`,
    padding: `${margin.top}px ${margin.right}px ${margin.bottom}px ${margin.left}px`,
    backgroundColor: theme.colors.background,
    color: theme.colors.text,
    fontFamily: fontFamily(theme.font_family),
    fontSize: body?.font_size ?? 10.5,
    lineHeight: body?.line_height ?? 1.45,
    fontWeight: body?.font_weight,
    '--resume-text': theme.colors.text,
    '--resume-muted': theme.colors.muted,
    '--resume-heading': theme.colors.heading,
    '--resume-accent': theme.colors.accent,
    '--resume-border': theme.colors.border,
    '--resume-background': theme.colors.background,
  } as CSSProperties

  return (
    <div ref={pageRef} className={styles.page} data-resume-page="true" style={pageStyle}>
      {resolved.error ? (
        <p>{resolved.error}</p>
      ) : resolved.layout ? (
        <LayoutView node={resolved.layout} theme={theme} />
      ) : null}
    </div>
  )
}
