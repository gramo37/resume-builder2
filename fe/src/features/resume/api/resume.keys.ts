export const resumeKeys = {
  all: ['resumes'] as const,
  lists: () => [...resumeKeys.all, 'list'] as const,
  detail: (id: number) => [...resumeKeys.all, 'detail', id] as const,
  templates: () => [...resumeKeys.all, 'templates'] as const,
}
