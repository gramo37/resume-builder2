import type { InputHTMLAttributes } from 'react'
import { cn } from '@/shared/lib/cn'
import styles from './Input.module.css'

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string
  error?: string
}

export function Input({ label, error, id, className, ...props }: InputProps) {
  const inputId = id ?? label.toLowerCase().replace(/\s+/g, '-')

  return (
    <div className={styles.field}>
      <label className={styles.label} htmlFor={inputId}>
        {label}
      </label>
      <input
        id={inputId}
        className={cn(styles.input, error && styles.inputError, className)}
        aria-invalid={Boolean(error)}
        {...props}
      />
      {error ? <p className={styles.error}>{error}</p> : null}
    </div>
  )
}
