import { paths } from '@/app/router/paths'

export const sidebarNav = [
  { to: paths.home, label: 'Home', icon: 'home' },
  { to: paths.automations, label: 'Automations', icon: 'automations' },
  { to: paths.jobs, label: 'Jobs', icon: 'jobs' },
  { to: paths.people, label: 'People', icon: 'people' },
  { to: paths.integrations, label: 'Integrations', icon: 'integrations' },
  { to: paths.resume, label: 'Resume', icon: 'resume' },
] as const

export type SidebarIconName = (typeof sidebarNav)[number]['icon']
