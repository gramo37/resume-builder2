import type { LayoutNode, ResumeDocument } from '../types/resume'
import { readCollection } from './binding'
import { resolveComponent } from './components'
import type { AbstractNode, RenderContext } from './types'

export function resolveLayout(resume: ResumeDocument): AbstractNode {
  return resolveNode(
    resume.template.layout,
    resume.template.components,
    resume.data,
    {},
  )
}

function resolveNode(
  node: LayoutNode,
  components: ResumeDocument['template']['components'],
  data: ResumeDocument['data'],
  context: RenderContext,
): AbstractNode {
  switch (node.type) {
    case 'grid':
      return {
        kind: 'grid',
        id: node.id,
        columns: node.columns.map(trackToCss),
        rows: node.rows?.map(trackToCss),
        gap: node.gap,
        style: node.style,
        children: node.children.map((child) => resolveNode(child, components, data, context)),
      }
    case 'component':
      return {
        kind: 'component',
        id: node.id,
        placement: node.grid,
        style: node.style,
        view: resolveComponent(node.component_id, components, data, context),
      }
    case 'spacer':
      return {
        kind: 'spacer',
        id: node.id,
        size: node.size,
        style: node.style,
      }
    case 'repeat':
      return {
        kind: 'stack',
        id: node.id,
        style: node.style,
        children: readCollection(data, node.binding.collection).flatMap((item, index) => {
          if (!isItem(item)) {
            return []
          }
          const suffix = typeof item.id === 'string' ? item.id : String(index)
          const resolved = resolveNode(node.children, components, data, {
            ...context,
            [node.item_id]: item,
          })
          return [suffixIds(resolved, suffix)]
        }),
      }
    default:
      return { kind: 'spacer', id: 'unknown', size: 0 }
  }
}

function suffixIds(node: AbstractNode, suffix: string): AbstractNode {
  const id = `${node.id}:${suffix}`
  if (node.kind === 'grid' || node.kind === 'stack') {
    return {
      ...node,
      id,
      children: node.children.map((child, index) => suffixIds(child, `${suffix}.${index}`)),
    }
  }
  return { ...node, id }
}

function trackToCss(track: string | number): string {
  return typeof track === 'number' ? `${track}px` : track
}

function isItem(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}
