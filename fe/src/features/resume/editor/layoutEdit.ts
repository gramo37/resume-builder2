import type { ComponentDefinition, ComponentNode, GridNode, LayoutNode } from '../types/resume'

const COLUMN_PREFIX = 'column:'

export type EditorSectionRef = {
  placementId: string
  componentId: string
}

export type EditorColumn = {
  id: string
  sections: EditorSectionRef[]
}

export type EditorBlock =
  | { kind: 'section'; section: EditorSectionRef }
  | { kind: 'columns'; columns: EditorColumn[] }
  | { kind: 'stack'; blocks: EditorBlock[] }

export type ComponentPlacement = {
  parentId: string
  index: number
  node: ComponentNode
}

export function columnDropId(gridId: string): string {
  return `${COLUMN_PREFIX}${gridId}`
}

export function humanizeId(id: string): string {
  const words = id.replace(/[_-]+/g, ' ').trim()
  return words.replace(/\b\w/g, (letter) => letter.toUpperCase())
}

export function describeEditor(layout: LayoutNode): EditorBlock | null {
  return describeNode(layout)
}

export function componentIdsInLayout(
  layout: LayoutNode,
  components: Record<string, ComponentDefinition>,
): string[] {
  const ids: string[] = []
  const seen = new Set<string>()

  const add = (id: string) => {
    if (seen.has(id) || !components[id]) {
      return
    }
    seen.add(id)
    ids.push(id)
    for (const child of components[id].children ?? []) {
      add(child.component_id)
    }
  }

  const walk = (node: LayoutNode) => {
    if (node.type === 'component') {
      add(node.component_id)
      return
    }
    if (node.type === 'grid') {
      node.children.forEach(walk)
    } else if (node.type === 'repeat') {
      walk(node.children)
    }
  }

  walk(layout)
  return ids
}

export function listGrids(layout: LayoutNode): GridNode[] {
  if (layout.type === 'grid') {
    return [layout, ...layout.children.flatMap(listGrids)]
  }
  if (layout.type === 'repeat') {
    return listGrids(layout.children)
  }
  return []
}

export function findPlacement(layout: LayoutNode, placementId: string): ComponentPlacement | null {
  return walkPlacement(layout, placementId)
}

export function moveLayoutNode(layout: LayoutNode, activeId: string, overId: string): LayoutNode {
  if (activeId === overId) {
    return layout
  }

  const active = findPlacement(layout, activeId)
  if (!active) {
    return layout
  }

  const overPlacement = findPlacement(layout, overId)
  if (overPlacement) {
    if (active.parentId === overPlacement.parentId) {
      if (active.index === overPlacement.index) {
        return layout
      }
      const parent = findGrid(layout, active.parentId)
      if (!parent) {
        return layout
      }
      return replaceGridChildren(
        layout,
        parent.id,
        arrayMove(parent.children, active.index, overPlacement.index),
      )
    }

    return relocate(layout, active, overPlacement.parentId, overPlacement.index)
  }

  const columnId = parseColumnDropId(overId)
  if (!columnId || columnId === active.parentId) {
    return layout
  }

  const target = findGrid(layout, columnId)
  if (!target || !isComponentColumn(target)) {
    return layout
  }

  return relocate(layout, active, target.id, target.children.length)
}

function describeNode(node: LayoutNode): EditorBlock | null {
  if (node.type === 'component') {
    return {
      kind: 'section',
      section: { placementId: node.id, componentId: node.component_id },
    }
  }

  if (node.type !== 'grid') {
    return node.type === 'repeat' ? describeNode(node.children) : null
  }

  if (isComponentColumn(node)) {
    return { kind: 'columns', columns: [toColumn(node)] }
  }

  const blocks: EditorBlock[] = []
  let pending: EditorColumn[] = []

  const flush = () => {
    if (pending.length === 0) {
      return
    }
    blocks.push({ kind: 'columns', columns: pending })
    pending = []
  }

  for (const child of node.children) {
    if (child.type === 'grid' && isComponentColumn(child)) {
      pending.push(toColumn(child))
      continue
    }
    flush()
    const described = describeNode(child)
    if (described) {
      blocks.push(described)
    }
  }
  flush()

  if (blocks.length === 1) {
    return blocks[0]
  }
  if (blocks.length === 0) {
    return null
  }
  return { kind: 'stack', blocks }
}

function toColumn(grid: GridNode): EditorColumn {
  return {
    id: grid.id,
    sections: grid.children.flatMap((child) =>
      child.type === 'component'
        ? [{ placementId: child.id, componentId: child.component_id }]
        : [],
    ),
  }
}

function isComponentColumn(grid: GridNode): boolean {
  return grid.children.every((child) => child.type === 'component' || child.type === 'spacer')
}

function parseColumnDropId(id: string): string | null {
  return id.startsWith(COLUMN_PREFIX) ? id.slice(COLUMN_PREFIX.length) : null
}

function walkPlacement(node: LayoutNode, placementId: string): ComponentPlacement | null {
  if (node.type !== 'grid') {
    return node.type === 'repeat' ? walkPlacement(node.children, placementId) : null
  }

  for (let index = 0; index < node.children.length; index += 1) {
    const child = node.children[index]
    if (child.type === 'component' && child.id === placementId) {
      return { parentId: node.id, index, node: child }
    }
    const nested = walkPlacement(child, placementId)
    if (nested) {
      return nested
    }
  }

  return null
}

function findGrid(node: LayoutNode, gridId: string): GridNode | null {
  if (node.type === 'grid') {
    if (node.id === gridId) {
      return node
    }
    for (const child of node.children) {
      const found = findGrid(child, gridId)
      if (found) {
        return found
      }
    }
  }
  if (node.type === 'repeat') {
    return findGrid(node.children, gridId)
  }
  return null
}

function replaceGridChildren(layout: LayoutNode, gridId: string, children: LayoutNode[]): LayoutNode {
  const walk = (node: LayoutNode): LayoutNode => {
    if (node.type === 'repeat') {
      return { ...node, children: walk(node.children) }
    }
    if (node.type !== 'grid') {
      return node
    }
    if (node.id === gridId) {
      return { ...node, children }
    }
    return { ...node, children: node.children.map(walk) }
  }
  return walk(layout)
}

function relocate(
  layout: LayoutNode,
  active: ComponentPlacement,
  targetParentId: string,
  targetIndex: number,
): LayoutNode {
  const walk = (node: LayoutNode): LayoutNode => {
    if (node.type === 'repeat') {
      return { ...node, children: walk(node.children) }
    }
    if (node.type !== 'grid') {
      return node
    }

    let children = node.children.map(walk)
    if (node.id === active.parentId) {
      children = children.filter((child) => child.id !== active.node.id)
    }
    if (node.id === targetParentId) {
      const index = Math.max(0, Math.min(targetIndex, children.length))
      children = [...children.slice(0, index), active.node, ...children.slice(index)]
    }
    return { ...node, children }
  }
  return walk(layout)
}

function arrayMove<T>(items: T[], from: number, to: number): T[] {
  const next = items.slice()
  const [item] = next.splice(from, 1)
  if (item === undefined) {
    return items
  }
  next.splice(to, 0, item)
  return next
}

export function setGridGap(layout: LayoutNode, gridId: string, gap: number | undefined): LayoutNode {
  const walk = (node: LayoutNode): LayoutNode => {
    if (node.type === 'repeat') {
      return { ...node, children: walk(node.children) }
    }
    if (node.type !== 'grid') {
      return node
    }
    const children = node.children.map(walk)
    if (node.id !== gridId) {
      return children === node.children ? node : { ...node, children }
    }
    const next: GridNode = { ...node, children }
    if (gap == null) {
      delete next.gap
    } else {
      next.gap = gap
    }
    return next
  }
  return walk(layout)
}
