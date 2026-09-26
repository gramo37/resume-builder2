import type {
  Binding,
  ComponentDefinition,
  ComponentRenderer,
  ComponentStyle,
  Contact,
  Education,
  Experience,
  Project,
  ResumeData,
  SkillGroup,
} from '../types/resume'
import { isRecord, resolveBinding } from './binding'
import type { ListEntry, RenderContext, ResolvedView } from './types'

type ComponentOverride = {
  binding?: Binding
  style?: ComponentStyle
}

export function resolveComponent(
  componentId: string,
  components: Record<string, ComponentDefinition>,
  data: ResumeData,
  context: RenderContext,
  override?: ComponentOverride,
): ResolvedView {
  const definition = components[componentId]
  if (!definition) {
    return { kind: 'empty' }
  }

  const style = mergeStyle(definition.style, override?.style)
  const binding = override?.binding ?? definition.binding
  const value = binding ? resolveBinding(binding, data, context) : undefined

  if (definition.type === 'section') {
    const blocks: ResolvedView[] = []
    if (definition.renderer) {
      blocks.push(resolveRenderer(definition.renderer, value))
    }
    for (const child of definition.children ?? []) {
      blocks.push(
        resolveComponent(child.component_id, components, data, context, {
          binding: child.binding,
          style: child.style,
        }),
      )
    }
    return { kind: 'section', title: definition.title, style, blocks }
  }

  switch (definition.type) {
    case 'text':
      return { kind: 'text', text: asText(value), style }
    case 'heading':
      return { kind: 'heading', text: asText(value), style }
    case 'rich_text':
      return { kind: 'rich_text', text: asText(value), style }
    case 'contact':
      return { kind: 'contact', contact: asContact(value), style }
    case 'list':
      return { kind: 'list', items: toListEntries(value), style }
    case 'divider':
      return { kind: 'divider', style }
    case 'spacer':
      return {
        kind: 'spacer',
        size: typeof style?.height === 'number' ? style.height : undefined,
        style,
      }
    default:
      return { kind: 'empty' }
  }
}

function resolveRenderer(renderer: ComponentRenderer, value: unknown): ResolvedView {
  switch (renderer) {
    case 'paragraph':
      return { kind: 'paragraph', text: paragraphText(value) }
    case 'experience':
      return { kind: 'experience', items: asItems(value, isExperience) }
    case 'education':
      return { kind: 'education', items: asItems(value, isEducation) }
    case 'projects':
      return { kind: 'projects', items: asItems(value, isProject) }
    case 'skill_groups':
      return { kind: 'skills', groups: asItems(value, isSkillGroup) }
    case 'list':
    case 'generic':
      return { kind: 'list', items: toListEntries(value) }
    case 'contact':
      return { kind: 'contact', contact: asContact(value) }
    default:
      return { kind: 'empty' }
  }
}

function mergeStyle(base?: ComponentStyle, extra?: ComponentStyle): ComponentStyle | undefined {
  if (!base && !extra) {
    return undefined
  }
  return { ...base, ...extra }
}

function asText(value: unknown): string {
  if (typeof value === 'string') {
    return value
  }
  if (typeof value === 'number' && Number.isFinite(value)) {
    return String(value)
  }
  return ''
}

function paragraphText(value: unknown): string {
  if (typeof value === 'string') {
    return value
  }
  if (isRecord(value) && typeof value.text === 'string') {
    return value.text
  }
  return ''
}

function asContact(value: unknown): Contact {
  if (!isRecord(value) || typeof value.id !== 'string') {
    return { id: '' }
  }
  return value as unknown as Contact
}

function asItems<T>(value: unknown, guard: (item: unknown) => item is T): T[] {
  if (!Array.isArray(value)) {
    return []
  }
  return value.filter(guard)
}

function isExperience(value: unknown): value is Experience {
  return isRecord(value) && typeof value.company === 'string' && typeof value.title === 'string'
}

function isEducation(value: unknown): value is Education {
  return isRecord(value) && typeof value.degree === 'string' && typeof value.institution === 'string'
}

function isProject(value: unknown): value is Project {
  return isRecord(value) && typeof value.name === 'string'
}

function isSkillGroup(value: unknown): value is SkillGroup {
  return isRecord(value) && typeof value.name === 'string' && Array.isArray(value.items)
}

export function toListEntries(value: unknown): ListEntry[] {
  if (!Array.isArray(value)) {
    if (!isRecord(value)) {
      return []
    }
    return toListEntries([value])
  }

  return value.flatMap((item, index): ListEntry[] => {
    if (!isRecord(item)) {
      return []
    }

    const id = typeof item.id === 'string' ? item.id : `item-${index}`
    if (typeof item.name === 'string' && Array.isArray(item.items)) {
      const skills = item.items.filter((skill): skill is string => typeof skill === 'string')
      return [{ id, primary: item.name, secondary: skills.join(', ') }]
    }

    const primary = pickString(item, ['name', 'title', 'label', 'degree', 'company', 'text'])
    if (!primary) {
      return []
    }

    const secondary = pickString(item, ['level', 'issuer', 'institution', 'description', 'headline', 'text'], primary)
    const meta = pickString(item, ['issue_date', 'location'])
    return [{ id, primary, secondary, meta }]
  })
}

function pickString(
  record: Record<string, unknown>,
  keys: string[],
  skip?: string,
): string | undefined {
  for (const key of keys) {
    const value = record[key]
    if (typeof value === 'string' && value.trim() !== '' && value !== skip) {
      return value
    }
  }
  return undefined
}
