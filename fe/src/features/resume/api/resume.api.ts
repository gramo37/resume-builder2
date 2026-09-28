import { apiClient } from '@/shared/api/client'
import type {
  CreateResumeInput,
  ResumeDetail,
  ResumeSummary,
  ResumeTemplateSummary,
  ResumeVersionDetail,
} from './resume.types'
import type { ResumeDocument } from '../types/resume'

export const resumeApi = {
  listTemplates() {
    return apiClient.get<{ templates: ResumeTemplateSummary[] }>('/api/templates')
  },
  list() {
    return apiClient.get<{ resumes: ResumeSummary[] }>('/api/resumes')
  },
  get(id: number) {
    return apiClient.get<ResumeDetail>(`/api/resumes/${id}`)
  },
  create(input: CreateResumeInput) {
    return apiClient.post<ResumeDetail>('/api/resumes', input)
  },
  saveVersion(id: number, content: ResumeDocument) {
    return apiClient.post<ResumeVersionDetail>(`/api/resumes/${id}/versions`, { content })
  },
}
