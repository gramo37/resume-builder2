import type { LayoutNode, ResumeDocument } from '../types/resume'
import { sampleResume } from './sampleResume'

const layout: LayoutNode = {
  type: 'grid',
  id: 'page',
  columns: ['1fr'],
  gap: 16,
  children: [
    { type: 'component', id: 'header', component_id: 'header' },
    { type: 'component', id: 'summary', component_id: 'summary_section' },
    { type: 'component', id: 'experience', component_id: 'experience_section' },
    { type: 'component', id: 'projects', component_id: 'projects_section' },
    { type: 'component', id: 'education', component_id: 'education_section' },
    { type: 'component', id: 'skills', component_id: 'skills_section' },
    { type: 'component', id: 'languages', component_id: 'languages_section' },
    { type: 'component', id: 'certifications', component_id: 'certifications_section' },
  ],
}

export const singleColumnResume: ResumeDocument = {
  schema_version: '2.0',
  document: {
    id: `${sampleResume.document.id}_single`,
    name: `${sampleResume.document.name} (single column)`,
  },
  template: {
    page: sampleResume.template.page,
    theme: sampleResume.template.theme,
    components: sampleResume.template.components,
    layout,
  },
  data: sampleResume.data,
}
