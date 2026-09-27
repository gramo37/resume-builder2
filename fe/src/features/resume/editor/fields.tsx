import type { ReactNode } from 'react'
import type { Spacing } from '../types/resume'
import { fieldsToSpacing, spacingToFields } from './documentEdit'
import styles from './fields.module.css'

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className={styles.field}>
      <span className={styles.label}>{label}</span>
      {children}
    </label>
  )
}

export function TextField({
  label,
  value,
  onChange,
  type = 'text',
  placeholder,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  type?: 'text' | 'email' | 'tel' | 'url'
  placeholder?: string
}) {
  return (
    <Field label={label}>
      <input
        className={styles.input}
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
      />
    </Field>
  )
}

export function AreaField({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
}) {
  return (
    <Field label={label}>
      <textarea
        className={styles.area}
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
      />
    </Field>
  )
}

export function NumberField({
  label,
  value,
  onChange,
  emptyValue = null,
}: {
  label: string
  value: number | undefined
  onChange: (value: number | null) => void
  emptyValue?: number | null
}) {
  return (
    <Field label={label}>
      <input
        className={styles.input}
        type="number"
        value={value ?? ''}
        onChange={(event) => {
          const raw = event.target.value
          if (raw.trim() === '') {
            onChange(emptyValue)
            return
          }
          const parsed = Number(raw)
          if (Number.isFinite(parsed)) {
            onChange(parsed)
          }
        }}
      />
    </Field>
  )
}

export function SelectField({
  label,
  value,
  onChange,
  options,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  options: { value: string; label: string }[]
}) {
  return (
    <Field label={label}>
      <select className={styles.select} value={value} onChange={(event) => onChange(event.target.value)}>
        {options.map((option) => (
          <option key={option.value || 'empty'} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </Field>
  )
}

export function ColorField({
  label,
  value,
  onChange,
}: {
  label: string
  value: string
  onChange: (value: string) => void
}) {
  const swatch = /^#[0-9a-fA-F]{6}$/.test(value) ? value : '#111111'
  return (
    <Field label={label}>
      <span className={styles.colorRow}>
        <input
          className={styles.swatch}
          type="color"
          value={swatch}
          aria-label={`${label} picker`}
          onChange={(event) => onChange(event.target.value)}
        />
        <input
          className={styles.input}
          value={value}
          spellCheck={false}
          onChange={(event) => onChange(event.target.value)}
        />
      </span>
    </Field>
  )
}

export function SpacingFields({
  label,
  value,
  onChange,
}: {
  label: string
  value: number | Spacing | undefined
  onChange: (value: number | Spacing | null) => void
}) {
  const fields = spacingToFields(value)
  const sides = ['Top', 'Right', 'Bottom', 'Left'] as const

  return (
    <div className={styles.stack}>
      <span className={styles.label}>{label}</span>
      <div className={styles.sides}>
        {sides.map((side, index) => (
          <Field key={side} label={side}>
            <input
              className={styles.input}
              type="number"
              value={fields[index]}
              onChange={(event) => {
                const next = [...fields] as [string, string, string, string]
                next[index] = event.target.value
                onChange(fieldsToSpacing(next))
              }}
            />
          </Field>
        ))}
      </div>
    </div>
  )
}

export function StringList({
  label,
  items,
  onChange,
}: {
  label: string
  items: string[]
  onChange: (items: string[]) => void
}) {
  return (
    <div className={styles.list}>
      <span className={styles.label}>{label}</span>
      {items.map((item, index) => (
        <div key={`${label}-${index}`} className={styles.listRow}>
          <input
            className={styles.input}
            value={item}
            aria-label={`${label} ${index + 1}`}
            onChange={(event) => {
              const next = items.slice()
              next[index] = event.target.value
              onChange(next)
            }}
          />
          <button
            type="button"
            className={styles.iconButton}
            aria-label={`Remove ${label} ${index + 1}`}
            onClick={() => onChange(items.filter((_, itemIndex) => itemIndex !== index))}
          >
            Remove
          </button>
        </div>
      ))}
      <button type="button" className={styles.textButton} onClick={() => onChange([...items, ''])}>
        Add {label}
      </button>
    </div>
  )
}

export function ItemActions({
  index,
  count,
  label,
  onMove,
  onRemove,
}: {
  index: number
  count: number
  label: string
  onMove: (direction: -1 | 1) => void
  onRemove: () => void
}) {
  return (
    <div className={styles.actions}>
      <button
        type="button"
        className={styles.iconButton}
        aria-label={`Move ${label} up`}
        disabled={index === 0}
        onClick={() => onMove(-1)}
      >
        Up
      </button>
      <button
        type="button"
        className={styles.iconButton}
        aria-label={`Move ${label} down`}
        disabled={index === count - 1}
        onClick={() => onMove(1)}
      >
        Down
      </button>
      <button type="button" className={styles.iconButton} aria-label={`Remove ${label}`} onClick={onRemove}>
        Remove
      </button>
    </div>
  )
}

export const fieldStyles = styles
