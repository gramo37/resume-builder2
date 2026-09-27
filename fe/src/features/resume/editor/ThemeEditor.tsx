import type { ReactNode } from 'react'
import type { ComponentDefinition, FontWeight, ResumeDocument, TextTransform } from '../types/resume'
import { isHeaderText } from './bindings'
import {
  isFontWeight,
  isTextTransform,
  updateComponentStyle,
  updateFontFamily,
  updatePageMargin,
  updateThemeColor,
  updateTypography,
} from './documentEdit'
import { ColorField, NumberField, SelectField, SpacingFields, TextField, fieldStyles } from './fields'
import { componentIdsInLayout, humanizeId, listGrids, setGridGap } from './layoutEdit'
import styles from './ThemeEditor.module.css'

const COLOR_KEYS = ['text', 'muted', 'heading', 'accent', 'border', 'background'] as const

const COLOR_TOKENS = [
  { value: 'theme.text', label: 'Text' },
  { value: 'theme.muted', label: 'Muted' },
  { value: 'theme.heading', label: 'Heading' },
  { value: 'theme.accent', label: 'Accent' },
  { value: 'theme.border', label: 'Border' },
  { value: 'theme.background', label: 'Background' },
]

const WEIGHTS = [100, 200, 300, 400, 500, 600, 700, 800, 900]

const TRANSFORMS: TextTransform[] = ['none', 'uppercase', 'lowercase', 'capitalize']

type ThemeEditorProps = {
  resume: ResumeDocument
  onChange: (resume: ResumeDocument) => void
}

export function ThemeEditor({ resume, onChange }: ThemeEditorProps) {
  const theme = resume.template.theme
  const ids = componentIdsInLayout(resume.template.layout, resume.template.components)
  const headerText = ids.filter((id) => isHeaderText(resume.template.components[id]))
  const sections = ids.filter((id) => resume.template.components[id]?.type === 'section')
  const grids = listGrids(resume.template.layout)

  return (
    <div className={styles.editor}>
      <Group title="Colors">
        <div className={fieldStyles.grid}>
          {COLOR_KEYS.map((key) => (
            <ColorField
              key={key}
              label={humanizeId(key)}
              value={theme.colors[key]}
              onChange={(value) => onChange(updateThemeColor(resume, key, value))}
            />
          ))}
        </div>
      </Group>

      <Group title="Type">
        <TextField
          label="Font family"
          value={theme.font_family}
          onChange={(value) => onChange(updateFontFamily(resume, value))}
        />
        <p className={styles.subhead}>Body</p>
        <div className={fieldStyles.grid}>
          <NumberField
            label="Font size"
            value={theme.typography?.body?.font_size}
            onChange={(value) => onChange(updateTypography(resume, 'body', { font_size: value }))}
          />
          <WeightField
            value={theme.typography?.body?.font_weight}
            onChange={(font_weight) => onChange(updateTypography(resume, 'body', { font_weight }))}
          />
          <NumberField
            label="Line height"
            value={theme.typography?.body?.line_height}
            onChange={(value) => onChange(updateTypography(resume, 'body', { line_height: value }))}
          />
        </div>
        <p className={styles.subhead}>Section headings</p>
        <div className={fieldStyles.grid}>
          <NumberField
            label="Font size"
            value={theme.typography?.section_heading?.font_size}
            onChange={(value) => onChange(updateTypography(resume, 'section_heading', { font_size: value }))}
          />
          <WeightField
            value={theme.typography?.section_heading?.font_weight}
            onChange={(font_weight) => onChange(updateTypography(resume, 'section_heading', { font_weight }))}
          />
          <TransformField
            value={theme.typography?.section_heading?.text_transform}
            onChange={(text_transform) => onChange(updateTypography(resume, 'section_heading', { text_transform }))}
          />
          <TokenColorField
            label="Color"
            value={theme.typography?.section_heading?.color}
            onChange={(color) => onChange(updateTypography(resume, 'section_heading', { color }))}
          />
        </div>
      </Group>

      <Group title="Page margin">
        <div className={fieldStyles.sides}>
          {(['top', 'right', 'bottom', 'left'] as const).map((side) => (
            <NumberField
              key={side}
              label={humanizeId(side)}
              value={resume.template.page.margin[side]}
              emptyValue={0}
              onChange={(value) => onChange(updatePageMargin(resume, side, value ?? 0))}
            />
          ))}
        </div>
      </Group>

      <Group title="Space between sections">
        <div className={fieldStyles.grid}>
          {grids.map((grid) => (
            <NumberField
              key={grid.id}
              label={humanizeId(grid.id)}
              value={grid.gap}
              onChange={(value) =>
                onChange({
                  ...resume,
                  template: {
                    ...resume.template,
                    layout: setGridGap(resume.template.layout, grid.id, value ?? undefined),
                  },
                })
              }
            />
          ))}
        </div>
      </Group>

      {headerText.length > 0 ? (
        <Group title="Header">
          {headerText.map((id) => {
            const definition = resume.template.components[id]
            const role = isHeaderText(definition)
            return (
              <div key={id} className={styles.block}>
                <p className={styles.subhead}>{role === 'headline' ? 'Headline' : 'Name'}</p>
                <div className={fieldStyles.grid}>
                  <NumberField
                    label="Font size"
                    value={definition?.style?.font_size}
                    onChange={(value) => onChange(updateComponentStyle(resume, id, { font_size: value }))}
                  />
                  <WeightField
                    value={definition?.style?.font_weight}
                    onChange={(font_weight) => onChange(updateComponentStyle(resume, id, { font_weight }))}
                  />
                  <TokenColorField
                    label="Color"
                    value={definition?.style?.color}
                    onChange={(color) => onChange(updateComponentStyle(resume, id, { color }))}
                  />
                </div>
              </div>
            )
          })}
        </Group>
      ) : null}

      <Group title="Sections">
        {sections.map((id) => (
          <SectionStyleFields
            key={id}
            resume={resume}
            componentId={id}
            definition={resume.template.components[id]}
            onChange={onChange}
          />
        ))}
      </Group>
    </div>
  )
}

function SectionStyleFields({
  resume,
  componentId,
  definition,
  onChange,
}: {
  resume: ResumeDocument
  componentId: string
  definition: ComponentDefinition
  onChange: (resume: ResumeDocument) => void
}) {
  const style = definition.style
  const showHeading = definition.title != null || Boolean(definition.renderer)
  const patch = (next: Parameters<typeof updateComponentStyle>[2]) =>
    onChange(updateComponentStyle(resume, componentId, next))

  return (
    <div className={styles.block}>
      <p className={styles.subhead}>{definition.title || humanizeId(componentId)}</p>
      <SpacingFields
        label="Padding"
        value={style?.padding}
        onChange={(padding) => patch({ padding })}
      />
      <SpacingFields
        label="Margin"
        value={style?.margin}
        onChange={(margin) => patch({ margin })}
      />
      <NumberField label="Gap" value={style?.gap} onChange={(gap) => patch({ gap })} />
      {showHeading ? (
        <div className={fieldStyles.grid}>
          <NumberField
            label="Heading size"
            value={style?.font_size}
            onChange={(font_size) => patch({ font_size })}
          />
          <WeightField value={style?.font_weight} onChange={(font_weight) => patch({ font_weight })} />
          <TransformField
            value={style?.text_transform}
            onChange={(text_transform) => patch({ text_transform })}
          />
          <TokenColorField label="Heading color" value={style?.color} onChange={(color) => patch({ color })} />
        </div>
      ) : null}
    </div>
  )
}

function WeightField({
  value,
  onChange,
}: {
  value: FontWeight | undefined
  onChange: (value: FontWeight | null) => void
}) {
  return (
    <SelectField
      label="Font weight"
      value={value == null ? '' : String(value)}
      options={[
        { value: '', label: 'Default' },
        ...WEIGHTS.map((weight) => ({ value: String(weight), label: String(weight) })),
      ]}
      onChange={(next) => {
        if (next === '') {
          onChange(null)
          return
        }
        const parsed = Number(next)
        if (isFontWeight(parsed)) {
          onChange(parsed)
        }
      }}
    />
  )
}

function TransformField({
  value,
  onChange,
}: {
  value: TextTransform | undefined
  onChange: (value: TextTransform | null) => void
}) {
  return (
    <SelectField
      label="Text transform"
      value={value ?? ''}
      options={[
        { value: '', label: 'Default' },
        ...TRANSFORMS.map((transform) => ({ value: transform, label: humanizeId(transform) })),
      ]}
      onChange={(next) => onChange(next === '' ? null : isTextTransform(next) ? next : null)}
    />
  )
}

function TokenColorField({
  label,
  value,
  onChange,
}: {
  label: string
  value: string | undefined
  onChange: (value: string | null) => void
}) {
  const isToken = COLOR_TOKENS.some((option) => option.value === value)
  const mode = !value ? '' : isToken ? value : 'custom'
  return (
    <>
      <SelectField
        label={label}
        value={mode}
        options={[
          { value: '', label: 'Default' },
          ...COLOR_TOKENS,
          { value: 'custom', label: 'Custom' },
        ]}
        onChange={(next) => {
          if (next === '') {
            onChange(null)
            return
          }
          if (next === 'custom') {
            onChange(value && !isToken ? value : '#111111')
            return
          }
          onChange(next)
        }}
      />
      {mode === 'custom' ? (
        <ColorField label={`${label} value`} value={value ?? '#111111'} onChange={onChange} />
      ) : null}
    </>
  )
}

function Group({ title, children }: { title: string; children: ReactNode }) {
  return (
    <details className={styles.group} open>
      <summary>{title}</summary>
      <div className={styles.groupBody}>{children}</div>
    </details>
  )
}
