const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

export function formatResumeDate(value: string | null | undefined): string {
  if (value == null || value === '') {
    return ''
  }

  const match = /^(\d{4})(?:-(\d{2}))?$/.exec(value)
  if (!match) {
    return value
  }

  const year = match[1]
  const month = match[2]
  if (!month) {
    return year
  }

  const index = Number(month) - 1
  if (index < 0 || index > 11) {
    return value
  }

  return `${MONTHS[index]} ${year}`
}

export function formatDateRange(start?: string, end?: string | null): string {
  const startLabel = formatResumeDate(start)
  const endLabel = end === null ? 'Present' : formatResumeDate(end)

  if (startLabel && endLabel) {
    return `${startLabel} – ${endLabel}`
  }

  return startLabel || endLabel
}

export function joinParts(parts: Array<string | undefined>): string {
  return parts.filter((part) => part && part.trim() !== '').join(' · ')
}
