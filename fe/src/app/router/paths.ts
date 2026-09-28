export const paths = {
  root: '/',
  login: '/login',
  home: '/home',
  automations: '/automations',
  jobs: '/jobs',
  people: '/people',
  integrations: '/integrations',
  resume: '/resume',
  resumeTemplate: '/resume/template',
  resumeEditor: (id: number | string) => `/resume/${id}`,
} as const
