import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  closestCorners,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useState } from 'react'
import type { ResumeDocument } from '../types/resume'
import { boundCollectionNames } from './bindings'
import { CustomCollectionCard, SectionCard, type DragHandle } from './SectionForm'
import {
  columnDropId,
  describeEditor,
  findPlacement,
  humanizeId,
  moveLayoutNode,
  type EditorBlock,
  type EditorColumn,
  type EditorSectionRef,
} from './layoutEdit'
import styles from './ContentEditor.module.css'

type ContentEditorProps = {
  resume: ResumeDocument
  onChange: (resume: ResumeDocument) => void
}

export function ContentEditor({ resume, onChange }: ContentEditorProps) {
  const [activeId, setActiveId] = useState<string | null>(null)
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )
  const block = describeEditor(resume.template.layout)
  const bound = boundCollectionNames(resume)
  const unboundCustom = Object.keys(resume.data.custom ?? {}).filter((name) => !bound.has(name))

  function handleDragStart(event: DragStartEvent) {
    setActiveId(String(event.active.id))
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveId(null)
    const { active, over } = event
    if (!over || active.id === over.id) {
      return
    }
    const layout = moveLayoutNode(resume.template.layout, String(active.id), String(over.id))
    if (layout === resume.template.layout) {
      return
    }
    onChange({
      ...resume,
      template: {
        ...resume.template,
        layout,
      },
    })
  }

  const activePlacement = activeId ? findPlacement(resume.template.layout, activeId) : null
  const activeTitle = activePlacement
    ? resume.template.components[activePlacement.node.component_id]?.title ||
      humanizeId(activePlacement.node.component_id)
    : ''

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={() => setActiveId(null)}
    >
      <div className={styles.editor}>
        {block ? <EditorBlockView block={block} resume={resume} onChange={onChange} /> : null}
        {unboundCustom.length > 0 ? (
          <div className={styles.extra}>
            <p className={styles.extraLabel}>Other data</p>
            {unboundCustom.map((name) => (
              <CustomCollectionCard key={name} resume={resume} name={name} onChange={onChange} />
            ))}
          </div>
        ) : null}
      </div>
      <DragOverlay>
        {activeId ? <div className={styles.overlay}>{activeTitle}</div> : null}
      </DragOverlay>
    </DndContext>
  )
}

function EditorBlockView({
  block,
  resume,
  onChange,
}: {
  block: EditorBlock
  resume: ResumeDocument
  onChange: (resume: ResumeDocument) => void
}) {
  switch (block.kind) {
    case 'section':
      return (
        <SectionCard
          resume={resume}
          placementId={block.section.placementId}
          componentId={block.section.componentId}
          onChange={onChange}
        />
      )
    case 'columns':
      return (
        <div className={styles.columns} style={{ gridTemplateColumns: `repeat(${block.columns.length}, minmax(0, 1fr))` }}>
          {block.columns.map((column) => (
            <ColumnView key={column.id} column={column} showLabel={block.columns.length > 1} resume={resume} onChange={onChange} />
          ))}
        </div>
      )
    case 'stack':
      return (
        <div className={styles.stack}>
          {block.blocks.map((child, index) => (
            <EditorBlockView key={blockKey(child, index)} block={child} resume={resume} onChange={onChange} />
          ))}
        </div>
      )
    default:
      return null
  }
}

function ColumnView({
  column,
  showLabel,
  resume,
  onChange,
}: {
  column: EditorColumn
  showLabel: boolean
  resume: ResumeDocument
  onChange: (resume: ResumeDocument) => void
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: columnDropId(column.id),
    disabled: column.sections.length > 0,
  })

  return (
    <div ref={setNodeRef} className={isOver ? styles.columnOver : styles.column}>
      {showLabel ? <p className={styles.columnLabel}>{humanizeId(column.id)}</p> : null}
      <SortableContext items={column.sections.map((section) => section.placementId)} strategy={verticalListSortingStrategy}>
        {column.sections.map((section) => (
          <SortableSection key={section.placementId} section={section} resume={resume} onChange={onChange} />
        ))}
      </SortableContext>
      {column.sections.length === 0 ? <p className={styles.empty}>Drop a section here</p> : null}
    </div>
  )
}

function SortableSection({
  section,
  resume,
  onChange,
}: {
  section: EditorSectionRef
  resume: ResumeDocument
  onChange: (resume: ResumeDocument) => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: section.placementId,
  })
  const drag: DragHandle = { attributes, listeners }

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.45 : 1,
      }}
    >
      <SectionCard
        resume={resume}
        placementId={section.placementId}
        componentId={section.componentId}
        onChange={onChange}
        drag={drag}
      />
    </div>
  )
}

function blockKey(block: EditorBlock, index: number): string {
  if (block.kind === 'section') {
    return block.section.placementId
  }
  if (block.kind === 'columns') {
    return block.columns.map((column) => column.id).join('-') || `columns-${index}`
  }
  return `stack-${index}`
}
