import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { resumeApi } from '../api/resume.api'
import { resumeKeys } from '../api/resume.keys'
import type { CreateResumeInput, ResumeDetail } from '../api/resume.types'
import type { ResumeDocument } from '../types/resume'

export function useResumeTemplates() {
  return useQuery({
    queryKey: resumeKeys.templates(),
    queryFn: resumeApi.listTemplates,
  })
}

export function useResumeList() {
  return useQuery({
    queryKey: resumeKeys.lists(),
    queryFn: resumeApi.list,
  })
}

export function useResume(id: number) {
  return useQuery({
    queryKey: resumeKeys.detail(id),
    queryFn: () => resumeApi.get(id),
    enabled: Number.isInteger(id) && id > 0,
  })
}

export function useCreateResume() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: CreateResumeInput) => resumeApi.create(input),
    onSuccess: (resume) => {
      queryClient.setQueryData(resumeKeys.detail(resume.id), resume)
      void queryClient.invalidateQueries({ queryKey: resumeKeys.lists() })
    },
  })
}

export function useSaveResumeVersion(id: number) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (content: ResumeDocument) => resumeApi.saveVersion(id, content),
    onSuccess: (version) => {
      queryClient.setQueryData<ResumeDetail>(resumeKeys.detail(id), (current) =>
        current
          ? {
              ...current,
              updatedAt: version.createdAt,
              currentVersion: version,
            }
          : current,
      )
      void queryClient.invalidateQueries({ queryKey: resumeKeys.lists() })
    },
  })
}
