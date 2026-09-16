import { cn } from '@/shared/lib/cn'
import styles from './Spinner.module.css'

type SpinnerProps = {
  size?: number
  page?: boolean
}

export function Spinner({ size = 20, page = false }: SpinnerProps) {
  const spinner = (
    <span
      className={styles.spinner}
      style={{ width: size, height: size }}
      role="status"
      aria-label="Loading"
    />
  )

  if (!page) {
    return spinner
  }

  return <div className={cn(styles.page)}>{spinner}</div>
}
