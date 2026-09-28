import type { ResumeDocument } from '../types/resume'

export type ResumeTemplateSummary = {
  id: number
  key: string
  name: string
  description: string
}

export type ResumeSummary = {
  id: number
  name: string
  templateId: number
  updatedAt: string
}

export type ResumeVersionDetail = {
  id: number
  versionNumber: number
  status: string
  source: string
  changeSummary: string | null
  createdAt: string
  parentVersionId: number | null
  content: ResumeDocument
}

export type ResumeDetail = {
  id: number
  name: string
  templateId: number
  createdAt: string
  updatedAt: string
  currentVersion: ResumeVersionDetail
}

export type CreateResumeInput = {
  name: string
  templateId: number
}
