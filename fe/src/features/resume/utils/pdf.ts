import html2canvas from 'html2canvas'
import { jsPDF } from 'jspdf'
import type { PageConfig, ResumeDocument } from '../types/resume'
import { pdfFormat } from './pageSize'

export function resumePdfFilename(resume: ResumeDocument): string {
  const slug = resume.data.person.name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

  return `${slug || 'resume'}.pdf`
}

export async function downloadResumePdf(
  element: HTMLElement,
  filename: string,
  page: PageConfig,
): Promise<void> {
  const host = document.createElement('div')
  host.style.position = 'fixed'
  host.style.left = '-10000px'
  host.style.top = '0'
  host.style.pointerEvents = 'none'

  const clone = element.cloneNode(true) as HTMLElement
  clone.style.transform = 'none'
  host.appendChild(clone)
  document.body.appendChild(host)

  try {
    const canvas = await html2canvas(clone, {
      scale: 2,
      useCORS: true,
      backgroundColor: '#ffffff',
      logging: false,
    })
    renderPdf(canvas, filename, page)
  } finally {
    host.remove()
  }
}

function renderPdf(canvas: HTMLCanvasElement, filename: string, page: PageConfig): void {
  const image = canvas.toDataURL('image/png')
  const pdf = new jsPDF({
    orientation: page.orientation,
    unit: 'mm',
    format: pdfFormat(page.size),
  })
  const pageWidth = pdf.internal.pageSize.getWidth()
  const pageHeight = pdf.internal.pageSize.getHeight()
  const imageHeight = (canvas.height * pageWidth) / canvas.width

  let remaining = imageHeight
  let offset = 0

  pdf.addImage(image, 'PNG', 0, offset, pageWidth, imageHeight)
  remaining -= pageHeight

  while (remaining > 1) {
    offset -= pageHeight
    pdf.addPage()
    pdf.addImage(image, 'PNG', 0, offset, pageWidth, imageHeight)
    remaining -= pageHeight
  }

  pdf.save(filename)
}
