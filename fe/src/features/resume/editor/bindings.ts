import type { Binding, ComponentDefinition, LayoutNode, ResumeDocument } from '../types/resume'

export type DataPanel =
  | { kind: 'person' }
  | { kind: 'contact' }
  | { kind: 'summary' }
  | { kind: 'skills' }
  | { kind: 'languages' }
  | { kind: 'experience' }
  | { kind: 'projects' }
  | { kind: 'education' }
  | { kind: 'certifications' }
  | { kind: 'custom'; name: string }

export function dataPanelsFor(
  componentId: string,
  components: Record<string, ComponentDefinition>,
): DataPanel[] {
  const seen = new Set<string>()
  const panels: DataPanel[] = []

  const visit = (id: string) => {
    const definition = components[id]
    if (!definition) {
      return
    }
    const panel = panelForBinding(definition.binding)
    if (panel) {
      const key = panel.kind === 'custom' ? `custom:${panel.name}` : panel.kind
      if (!seen.has(key)) {
        seen.add(key)
        panels.push(panel)
      }
    }
    for (const child of definition.children ?? []) {
      visit(child.component_id)
    }
  }

  visit(componentId)
  return panels
}

export function boundCollectionNames(resume: ResumeDocument): Set<string> {
  const names = new Set<string>()
  const visit = (id: string) => {
    const definition = resume.template.components[id]
    if (!definition) {
      return
    }
    if (definition.binding && 'collection' in definition.binding) {
      names.add(definition.binding.collection)
    }
    for (const child of definition.children ?? []) {
      visit(child.component_id)
    }
  }

  const walk = (node: LayoutNode) => {
    if (node.type === 'component') {
      visit(node.component_id)
      return
    }
    if (node.type === 'grid') {
      node.children.forEach(walk)
      return
    }
    if (node.type === 'repeat') {
      if ('collection' in node.binding) {
        names.add(node.binding.collection)
      }
      walk(node.children)
    }
  }

  walk(resume.template.layout)
  return names
}

export function isHeaderText(definition: ComponentDefinition | undefined): 'name' | 'headline' | null {
  const binding = definition?.binding
  if (!binding || definition.type !== 'text' || !('entity' in binding)) {
    return null
  }
  if (binding.entity === 'person' && binding.field === 'name') {
    return 'name'
  }
  if (binding.entity === 'person' && binding.field === 'headline') {
    return 'headline'
  }
  return null
}

function panelForBinding(binding: Binding | undefined): DataPanel | null {
  if (!binding || binding.source !== 'data') {
    return null
  }
  if ('collection' in binding) {
    switch (binding.collection) {
      case 'skills':
        return { kind: 'skills' }
      case 'languages':
        return { kind: 'languages' }
      case 'experience':
        return { kind: 'experience' }
      case 'projects':
        return { kind: 'projects' }
      case 'education':
        return { kind: 'education' }
      case 'certifications':
        return { kind: 'certifications' }
      default:
        return { kind: 'custom', name: binding.collection }
    }
  }
  switch (binding.entity) {
    case 'person':
      return { kind: 'person' }
    case 'contact':
      return { kind: 'contact' }
    case 'summary':
      return { kind: 'summary' }
    default:
      return null
  }
}
