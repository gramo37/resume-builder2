import type { PageConfig, PageSize } from '../types/resume'

const PAGE_MM: Record<PageSize, { width: number; height: number }> = {
  A4: { width: 210, height: 297 },
  A3: { width: 297, height: 420 },
  A5: { width: 148, height: 210 },
  LETTER: { width: 215.9, height: 279.4 },
  LEGAL: { width: 215.9, height: 355.6 },
}

export function pageDimensions(page: PageConfig): { widthMm: number; heightMm: number } {
  const size = PAGE_MM[page.size]
  if (page.orientation === 'landscape') {
    return { widthMm: size.height, heightMm: size.width }
  }

  return { widthMm: size.width, heightMm: size.height }
}

export function pdfFormat(size: PageSize): 'a3' | 'a4' | 'a5' | 'letter' | 'legal' {
  switch (size) {
    case 'A3':
      return 'a3'
    case 'A5':
      return 'a5'
    case 'LETTER':
      return 'letter'
    case 'LEGAL':
      return 'legal'
    default:
      return 'a4'
  }
}
