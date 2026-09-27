import type {
  Achievement,
  Certification,
  ComponentDefinition,
  ComponentStyle,
  Contact,
  ContactLink,
  CustomCollection,
  CustomItem,
  Education,
  Experience,
  FontWeight,
  Language,
  Person,
  Project,
  ResumeData,
  ResumeDocument,
  SkillGroup,
  Spacing,
  TextTransform,
  TypographyStyle,
} from '../types/resume'

type CollectionKey = 'skills' | 'languages' | 'experience' | 'projects' | 'education' | 'certifications'

type TypographyKey = 'body' | 'heading' | 'section_heading'

export type StylePatch = {
  [K in keyof ComponentStyle]?: ComponentStyle[K] | null
}

export type TypographyPatch = {
  [K in keyof TypographyStyle]?: TypographyStyle[K] | null
}

export function createId(prefix: string): string {
  return `${prefix}_${crypto.randomUUID().replace(/-/g, '').slice(0, 8)}`
}

export function moveByIndex<T>(items: T[], index: number, direction: -1 | 1): T[] {
  const target = index + direction
  if (target < 0 || target >= items.length) {
    return items
  }
  const next = items.slice()
  const [item] = next.splice(index, 1)
  if (item === undefined) {
    return items
  }
  next.splice(target, 0, item)
  return next
}

export function spacingToFields(value: number | Spacing | undefined): [string, string, string, string] {
  if (typeof value === 'number') {
    const text = String(value)
    return [text, text, text, text]
  }
  return [
    value?.top != null ? String(value.top) : '',
    value?.right != null ? String(value.right) : '',
    value?.bottom != null ? String(value.bottom) : '',
    value?.left != null ? String(value.left) : '',
  ]
}

export function fieldsToSpacing(fields: [string, string, string, string]): number | Spacing | null {
  const parsed = fields.map((field) => {
    if (field.trim() === '') {
      return undefined
    }
    const number = Number(field)
    return Number.isFinite(number) ? number : undefined
  }) as [number | undefined, number | undefined, number | undefined, number | undefined]

  if (parsed.every((value) => value == null)) {
    return null
  }

  if (parsed.every((value) => value != null && value === parsed[0])) {
    return parsed[0] as number
  }

  const [top, right, bottom, left] = parsed
  const spacing: Spacing = {}
  if (top != null) spacing.top = top
  if (right != null) spacing.right = right
  if (bottom != null) spacing.bottom = bottom
  if (left != null) spacing.left = left
  return spacing
}

export function setPerson(resume: ResumeDocument, person: Person): ResumeDocument {
  return withData(resume, { ...resume.data, person })
}

export function setContact(resume: ResumeDocument, contact: Contact): ResumeDocument {
  return withData(resume, { ...resume.data, contact })
}

export function setSummaryText(resume: ResumeDocument, text: string): ResumeDocument {
  return withData(resume, {
    ...resume.data,
    summary: {
      id: resume.data.summary?.id ?? createId('summary'),
      text,
    },
  })
}

export function setSkills(resume: ResumeDocument, skills: SkillGroup[]): ResumeDocument {
  return setCollection(resume, 'skills', skills)
}

export function setLanguages(resume: ResumeDocument, languages: Language[]): ResumeDocument {
  return setCollection(resume, 'languages', languages)
}

export function setExperience(resume: ResumeDocument, experience: Experience[]): ResumeDocument {
  return setCollection(resume, 'experience', experience)
}

export function setProjects(resume: ResumeDocument, projects: Project[]): ResumeDocument {
  return setCollection(resume, 'projects', projects)
}

export function setEducation(resume: ResumeDocument, education: Education[]): ResumeDocument {
  return setCollection(resume, 'education', education)
}

export function setCertifications(resume: ResumeDocument, certifications: Certification[]): ResumeDocument {
  return setCollection(resume, 'certifications', certifications)
}

export function setCustomCollection(
  resume: ResumeDocument,
  name: string,
  collection: CustomCollection,
): ResumeDocument {
  return withData(resume, {
    ...resume.data,
    custom: {
      ...resume.data.custom,
      [name]: collection,
    },
  })
}

export function updateComponentDefinition(
  resume: ResumeDocument,
  componentId: string,
  updater: (definition: ComponentDefinition) => ComponentDefinition,
): ResumeDocument {
  const current = resume.template.components[componentId]
  if (!current) {
    return resume
  }
  return {
    ...resume,
    template: {
      ...resume.template,
      components: {
        ...resume.template.components,
        [componentId]: updater(current),
      },
    },
  }
}

export function updateComponentStyle(
  resume: ResumeDocument,
  componentId: string,
  patch: StylePatch,
): ResumeDocument {
  return updateComponentDefinition(resume, componentId, (definition) => {
    const style: ComponentStyle = { ...definition.style }
    for (const key of Object.keys(patch) as (keyof ComponentStyle)[]) {
      const value = patch[key]
      if (value == null) {
        delete style[key]
      } else {
        Object.assign(style, { [key]: value })
      }
    }
    return {
      ...definition,
      style: Object.keys(style).length > 0 ? style : undefined,
    }
  })
}

export function updateThemeColor(
  resume: ResumeDocument,
  key: keyof ResumeDocument['template']['theme']['colors'],
  value: string,
): ResumeDocument {
  return {
    ...resume,
    template: {
      ...resume.template,
      theme: {
        ...resume.template.theme,
        colors: {
          ...resume.template.theme.colors,
          [key]: value,
        },
      },
    },
  }
}

export function updateFontFamily(resume: ResumeDocument, fontFamily: string): ResumeDocument {
  return {
    ...resume,
    template: {
      ...resume.template,
      theme: {
        ...resume.template.theme,
        font_family: fontFamily,
      },
    },
  }
}

export function updateTypography(
  resume: ResumeDocument,
  key: TypographyKey,
  patch: TypographyPatch,
): ResumeDocument {
  const current = resume.template.theme.typography?.[key] ?? {}
  const next: TypographyStyle = { ...current }
  for (const field of Object.keys(patch) as (keyof TypographyStyle)[]) {
    const value = patch[field]
    if (value == null) {
      delete next[field]
    } else {
      Object.assign(next, { [field]: value })
    }
  }

  return {
    ...resume,
    template: {
      ...resume.template,
      theme: {
        ...resume.template.theme,
        typography: {
          ...resume.template.theme.typography,
          [key]: next,
        },
      },
    },
  }
}

export function updatePageMargin(
  resume: ResumeDocument,
  side: keyof ResumeDocument['template']['page']['margin'],
  value: number,
): ResumeDocument {
  return {
    ...resume,
    template: {
      ...resume.template,
      page: {
        ...resume.template.page,
        margin: {
          ...resume.template.page.margin,
          [side]: value,
        },
      },
    },
  }
}

export function blankAchievement(): Achievement {
  return { id: createId('achievement'), text: '' }
}

export function blankLink(): ContactLink {
  return { id: createId('link'), label: 'Link', url: 'https://' }
}

export function blankSkillGroup(): SkillGroup {
  return { id: createId('skill_group'), name: '', items: [] }
}

export function blankLanguage(): Language {
  return { id: createId('language'), name: '' }
}

export function blankExperience(): Experience {
  return { id: createId('experience'), company: '', title: '', achievements: [] }
}

export function blankProject(): Project {
  return { id: createId('project'), name: '', technologies: [], achievements: [] }
}

export function blankEducation(): Education {
  return { id: createId('education'), degree: '', institution: '', achievements: [] }
}

export function blankCertification(): Certification {
  return { id: createId('certification'), name: '' }
}

export function blankCustomItem(sample: CustomItem | undefined): CustomItem {
  const item: CustomItem = { id: createId('custom') }
  if (!sample) {
    item.text = ''
    return item
  }
  for (const [key, value] of Object.entries(sample)) {
    if (key === 'id') {
      continue
    }
    if (typeof value === 'string') {
      item[key] = ''
    } else if (typeof value === 'number') {
      item[key] = 0
    } else if (Array.isArray(value)) {
      item[key] = []
    }
  }
  return item
}

export function isFontWeight(value: number): value is FontWeight {
  return [100, 200, 300, 400, 500, 600, 700, 800, 900].includes(value)
}

export function isTextTransform(value: string): value is TextTransform {
  return value === 'none' || value === 'uppercase' || value === 'lowercase' || value === 'capitalize'
}

function setCollection<K extends CollectionKey>(
  resume: ResumeDocument,
  key: K,
  items: NonNullable<ResumeData[K]>,
): ResumeDocument {
  return withData(resume, { ...resume.data, [key]: items })
}

function withData(resume: ResumeDocument, data: ResumeData): ResumeDocument {
  return { ...resume, data }
}
