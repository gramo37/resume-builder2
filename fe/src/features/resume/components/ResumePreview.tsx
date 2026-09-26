import { useLayoutEffect, useRef, useState, type Ref } from 'react'
import type { ResumeDocument } from '../types/resume'
import { pageDimensions } from '../utils/pageSize'
import { ResumeRenderer } from './ResumeRenderer'
import styles from './ResumePreview.module.css'

const MM_TO_PX = 96 / 25.4

function pagePixelSize(resume: ResumeDocument) {
  const { widthMm, heightMm } = pageDimensions(resume.template.page)
  return { width: widthMm * MM_TO_PX, height: heightMm * MM_TO_PX }
}

type ResumePreviewProps = {
  resume: ResumeDocument
  pageRef: Ref<HTMLDivElement>
}

export function ResumePreview({ resume, pageRef }: ResumePreviewProps) {
  const stageRef = useRef<HTMLDivElement>(null)
  const measureRef = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(1)
  const [contentHeight, setContentHeight] = useState(pagePixelSize(resume).height)
  const pageSize = pagePixelSize(resume)

  useLayoutEffect(() => {
    const stage = stageRef.current
    const page = measureRef.current
    if (!stage) {
      return
    }

    const update = () => {
      const available = stage.clientWidth - 32
      setScale(Math.max(0.32, Math.min(1, available / pageSize.width)))
      if (page) {
        setContentHeight(page.offsetHeight)
      }
    }

    update()
    const observer = new ResizeObserver(update)
    observer.observe(stage)
    if (page) {
      observer.observe(page)
    }

    return () => observer.disconnect()
  }, [pageSize.width, resume])

  return (
    <div className={styles.preview}>
      <p className={styles.label}>{resume.template.page.size} Preview</p>
      <div className={styles.stage} ref={stageRef}>
        <div
          className={styles.scaler}
          style={{
            width: pageSize.width * scale,
            height: contentHeight * scale,
          }}
        >
          <div
            className={styles.shadow}
            style={{
              width: pageSize.width,
              transform: `scale(${scale})`,
            }}
            ref={measureRef}
          >
            <ResumeRenderer resume={resume} pageRef={pageRef} />
          </div>
        </div>
      </div>
    </div>
  )
}
