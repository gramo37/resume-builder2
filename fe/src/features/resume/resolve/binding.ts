import type { Binding, ResumeData } from '../types/resume'
import type { RenderContext } from './types'

const COLLECTIONS = [
  'skills',
  'languages',
  'experience',
  'projects',
  'education',
  'certifications',
] as const

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

export function readCollection(data: ResumeData, name: string): unknown[] {
  switch (name) {
    case 'skills':
      return data.skills ?? []
    case 'languages':
      return data.languages ?? []
    case 'experience':
      return data.experience ?? []
    case 'projects':
      return data.projects ?? []
    case 'education':
      return data.education ?? []
    case 'certifications':
      return data.certifications ?? []
    default:
      return data.custom?.[name]?.items ?? []
  }
}

export function isKnownCollection(data: ResumeData, name: string): boolean {
  return (COLLECTIONS as readonly string[]).includes(name) || Boolean(data.custom?.[name])
}

export function resolveBinding(
  binding: Binding,
  data: ResumeData,
  context: RenderContext,
): unknown {
  if (binding.source === 'context') {
    const current = context[binding.context]
    if (!binding.field) {
      return current
    }
    if (!isRecord(current)) {
      return undefined
    }
    return current[binding.field]
  }

  if ('collection' in binding) {
    return readCollection(data, binding.collection)
  }

  const entity = readEntity(data, binding.entity, binding.id)
  if (entity === undefined) {
    return undefined
  }
  if (!binding.field) {
    return entity
  }
  if (!isRecord(entity)) {
    return undefined
  }
  return entity[binding.field]
}

function readEntity(data: ResumeData, entity: string, id: string): unknown {
  if (entity === 'person' && data.person.id === id) {
    return data.person
  }
  if (entity === 'contact' && data.contact.id === id) {
    return data.contact
  }
  if (entity === 'summary' && data.summary?.id === id) {
    return data.summary
  }

  const custom = data.custom?.[entity]
  if (custom?.id === id) {
    return custom
  }

  return readCollection(data, entity).find((item) => isRecord(item) && item.id === id)
}
