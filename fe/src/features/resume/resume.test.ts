import { describe, expect, it } from 'vitest'
import { sampleResume, sampleResumeSource } from './data/sampleResume'
import { singleColumnResume } from './data/singleColumnResume'
import { resolveBinding } from './resolve/binding'
import { resolveLayout } from './resolve/layout'
import type { AbstractNode } from './resolve/types'
import { parseResumeJson, validateResume } from './schema/validateResume'
import type {
  ComponentDefinition,
  LayoutNode,
  ResumeData,
  ResumeDocument,
} from './types/resume'
import { columnDropId, moveLayoutNode } from './editor/layoutEdit'
import { gridTemplateColumns, placementStyle, resolveThemeColor } from './utils/styleToCss'

function componentIds(node: AbstractNode): string[] {
  if (node.kind === 'component') {
    return [node.id]
  }
  if (node.kind === 'grid' || node.kind === 'stack') {
    return node.children.flatMap(componentIds)
  }
  return []
}

function findComponent(node: AbstractNode, id: string): Extract<AbstractNode, { kind: 'component' }> | undefined {
  if (node.kind === 'component' && node.id === id) {
    return node
  }
  if (node.kind === 'grid' || node.kind === 'stack') {
    for (const child of node.children) {
      const found = findComponent(child, id)
      if (found) {
        return found
      }
    }
  }
  return undefined
}

function resumeFixture(
  layout: LayoutNode,
  components: Record<string, ComponentDefinition>,
  data: Partial<ResumeData> = {},
): ResumeDocument {
  return {
    schema_version: '2.0',
    document: { id: 'doc_test', name: 'Test resume' },
    template: {
      page: {
        size: 'A4',
        orientation: 'portrait',
        margin: { top: 24, right: 24, bottom: 24, left: 24 },
      },
      theme: sampleResume.template.theme,
      layout,
      components,
    },
    data: {
      person: sampleResume.data.person,
      contact: sampleResume.data.contact,
      ...data,
    },
  }
}

describe('resume schema', () => {
  it('accepts the sample resume and ignores automatic rows', () => {
    const result = validateResume(sampleResumeSource)
    expect(result.ok).toBe(true)
    if (!result.ok || result.resume.template.layout.type !== 'grid') {
      return
    }
    expect(result.resume.template.layout.rows).toBeUndefined()
    expect(result.resume.data.person.name).toBe('Prasanna Gramopadhye')
  })

  it('rejects invalid JSON and unknown bindings', () => {
    expect(parseResumeJson('{').ok).toBe(false)

    const broken = structuredClone(sampleResume)
    const name = broken.template.components.name
    if (name?.binding && name.binding.source === 'data' && 'entity' in name.binding) {
      name.binding.id = 'missing_person'
    }

    const result = validateResume(broken)
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.error).toContain('missing_person')
    }
  })
})

describe('layout resolution', () => {
  it('keeps nested grids and column tracks', () => {
    const layout = resolveLayout(sampleResume)
    expect(layout.kind).toBe('grid')
    if (layout.kind !== 'grid') {
      return
    }

    const body = layout.children[1]
    expect(body?.kind).toBe('grid')
    if (body?.kind !== 'grid') {
      return
    }

    expect(body.columns).toEqual(['30%', '70%'])
    expect(body.children.map((child) => child.kind)).toEqual(['grid', 'grid'])
    expect(gridTemplateColumns(body.columns)).toBe('minmax(0, 30fr) minmax(0, 70fr)')
  })

  it('follows section order from the template', () => {
    expect(componentIds(resolveLayout(sampleResume))).toEqual([
      'header',
      'skills',
      'languages',
      'certifications',
      'summary',
      'experience',
      'projects',
      'education',
    ])

    const reordered = structuredClone(sampleResume)
    const page = reordered.template.layout
    if (page.type !== 'grid') {
      throw new Error('expected a page grid')
    }
    const body = page.children[1]
    if (body?.type !== 'grid') {
      throw new Error('expected a body grid')
    }
    const main = body.children[1]
    if (main?.type !== 'grid') {
      throw new Error('expected a main grid')
    }

    const education = main.children[3]
    const experience = main.children[1]
    if (!education || !experience) {
      throw new Error('expected education and experience placements')
    }
    main.children[1] = education
    main.children[3] = experience

    expect(componentIds(resolveLayout(reordered))).toEqual([
      'header',
      'skills',
      'languages',
      'certifications',
      'summary',
      'education',
      'projects',
      'experience',
    ])
  })

  it('preserves row and column spans', () => {
    const document = resumeFixture(
      {
        type: 'grid',
        id: 'page',
        columns: ['1fr', '1fr', '1fr'],
        rows: ['auto', 'auto'],
        children: [
          {
            type: 'component',
            id: 'banner',
            component_id: 'name',
            grid: { column: 1, column_span: 3 },
          },
          {
            type: 'component',
            id: 'side',
            component_id: 'name',
            grid: { column: 1, row: 2, row_span: 1 },
          },
        ],
      },
      {
        name: {
          type: 'text',
          binding: { source: 'data', entity: 'person', id: 'person_001', field: 'name' },
        },
      },
    )

    const layout = resolveLayout(document)
    if (layout.kind !== 'grid') {
      throw new Error('expected a grid')
    }

    const banner = layout.children[0]
    const side = layout.children[1]
    if (banner?.kind !== 'component' || side?.kind !== 'component') {
      throw new Error('expected component placements')
    }

    expect(banner.placement).toEqual({ column: 1, column_span: 3 })
    expect(side.placement).toEqual({ column: 1, row: 2, row_span: 1 })
    expect(placementStyle(banner.placement)).toMatchObject({ gridColumn: '1 / span 3' })
    expect(placementStyle(side.placement)).toMatchObject({ gridColumn: '1 / span 1', gridRow: '2 / span 1' })
  })

  it('renders the same data with a single-column template', () => {
    expect(singleColumnResume.data).toBe(sampleResume.data)
    expect(componentIds(resolveLayout(singleColumnResume))).toEqual([
      'header',
      'summary',
      'experience',
      'projects',
      'education',
      'skills',
      'languages',
      'certifications',
    ])
  })
})

describe('data binding', () => {
  it('resolves entity fields by id', () => {
    expect(
      resolveBinding(
        { source: 'data', entity: 'person', id: 'person_001', field: 'name' },
        sampleResume.data,
        {},
      ),
    ).toBe('Prasanna Gramopadhye')

    expect(
      resolveBinding(
        { source: 'data', entity: 'person', id: 'missing', field: 'name' },
        sampleResume.data,
        {},
      ),
    ).toBeUndefined()

    expect(resolveThemeColor('theme.heading', sampleResume.template.theme)).toBe('#111111')
  })

  it('resolves collections onto section renderers', () => {
    const experience = findComponent(resolveLayout(sampleResume), 'experience')
    expect(experience?.view.kind).toBe('section')
    if (experience?.view.kind !== 'section') {
      return
    }

    const body = experience.view.blocks[0]
    expect(body?.kind).toBe('experience')
    if (body?.kind !== 'experience') {
      return
    }
    expect(body.items.map((item) => item.company)).toEqual(['Innodata'])
  })

  it('repeats a layout for each collection item', () => {
    const document = resumeFixture(
      {
        type: 'repeat',
        id: 'project_repeat',
        binding: { source: 'data', collection: 'projects' },
        item_id: 'project',
        children: {
          type: 'component',
          id: 'project_name',
          component_id: 'project_name',
        },
      },
      {
        project_name: {
          type: 'text',
          binding: { source: 'context', context: 'project', field: 'name' },
        },
      },
      {
        projects: [
          { id: 'project_a', name: 'Alpha' },
          { id: 'project_b', name: 'Beta' },
        ],
      },
    )

    expect(validateResume(document).ok).toBe(true)
    const layout = resolveLayout(document)
    expect(layout.kind).toBe('stack')
    if (layout.kind !== 'stack') {
      return
    }

    const names = layout.children.map((child) => {
      if (child.kind !== 'component' || child.view.kind !== 'text') {
        return ''
      }
      return child.view.text
    })
    expect(names).toEqual(['Alpha', 'Beta'])
  })

  it('renders a custom collection without a new schema', () => {
    const document = resumeFixture(
      {
        type: 'component',
        id: 'awards',
        component_id: 'awards_section',
      },
      {
        awards_section: {
          type: 'section',
          title: 'Awards',
          binding: { source: 'data', collection: 'awards' },
          renderer: 'list',
        },
      },
      {
        custom: {
          awards: {
            id: 'awards',
            title: 'Awards',
            items: [{ id: 'award_001', name: 'Hackathon winner' }],
          },
        },
      },
    )

    expect(validateResume(document).ok).toBe(true)
    const awards = findComponent(resolveLayout(document), 'awards')
    expect(awards?.view.kind).toBe('section')
    if (awards?.view.kind !== 'section') {
      return
    }

    const list = awards.view.blocks[0]
    expect(list?.kind).toBe('list')
    if (list?.kind !== 'list') {
      return
    }
    expect(list.items.map((item) => item.primary)).toEqual(['Hackathon winner'])
  })
})

function gridChildIds(layout: LayoutNode, gridId: string): string[] {
  const walk = (node: LayoutNode): string[] | null => {
    if (node.type === 'grid') {
      if (node.id === gridId) {
        return node.children.map((child) => child.id)
      }
      for (const child of node.children) {
        const found = walk(child)
        if (found) {
          return found
        }
      }
    }
    if (node.type === 'repeat') {
      return walk(node.children)
    }
    return null
  }
  return walk(layout) ?? []
}

describe('moveLayoutNode', () => {
  const layout = sampleResume.template.layout

  it('reorders sections inside a column', () => {
    const moved = moveLayoutNode(layout, 'experience', 'summary')
    expect(gridChildIds(moved, 'main_content')).toEqual(['experience', 'summary', 'projects', 'education'])
    expect(gridChildIds(layout, 'main_content')).toEqual(['summary', 'experience', 'projects', 'education'])
  })

  it('moves a section into another column', () => {
    const moved = moveLayoutNode(layout, 'skills', 'summary')
    expect(gridChildIds(moved, 'sidebar')).toEqual(['languages', 'certifications'])
    expect(gridChildIds(moved, 'main_content')).toEqual([
      'skills',
      'summary',
      'experience',
      'projects',
      'education',
    ])
    expect(gridChildIds(layout, 'sidebar')).toEqual(['skills', 'languages', 'certifications'])
  })

  it('appends a section when dropped on an empty column target', () => {
    const moved = moveLayoutNode(layout, 'experience', columnDropId('sidebar'))
    expect(gridChildIds(moved, 'main_content')).toEqual(['summary', 'projects', 'education'])
    expect(gridChildIds(moved, 'sidebar')).toEqual(['skills', 'languages', 'certifications', 'experience'])
  })

  it('leaves the layout untouched for an unknown section', () => {
    expect(moveLayoutNode(layout, 'missing', 'summary')).toBe(layout)
    expect(moveLayoutNode(layout, 'experience', 'experience')).toBe(layout)
  })

  it('reorders a single-column layout', () => {
    const single = singleColumnResume.template.layout
    const moved = moveLayoutNode(single, 'experience', 'summary')
    expect(gridChildIds(moved, 'page')).toEqual([
      'header',
      'experience',
      'summary',
      'projects',
      'education',
      'skills',
      'languages',
      'certifications',
    ])
  })
})
