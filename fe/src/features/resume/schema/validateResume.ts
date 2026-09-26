import { isKnownCollection, isRecord } from '../resolve/binding'
import type {
  Achievement,
  Binding,
  BorderStyle,
  Certification,
  ComponentChild,
  ComponentDefinition,
  ComponentRenderer,
  ComponentStyle,
  ComponentType,
  Contact,
  ContactLink,
  CustomCollection,
  CustomItem,
  Education,
  Experience,
  FontWeight,
  GridNode,
  GridTrack,
  Language,
  LayoutNode,
  LayoutStyle,
  PageConfig,
  PageMargin,
  Person,
  Project,
  ResumeData,
  ResumeDocument,
  ResumeTemplate,
  ResumeTheme,
  SkillGroup,
  SpacerNode,
  Spacing,
  Summary,
  TypographyStyle,
} from '../types/resume'

const COMPONENT_TYPES = [
  'text',
  'heading',
  'section',
  'contact',
  'list',
  'rich_text',
  'divider',
  'spacer',
] as const satisfies readonly ComponentType[]

const RENDERERS = [
  'paragraph',
  'experience',
  'education',
  'projects',
  'skill_groups',
  'list',
  'contact',
  'generic',
] as const satisfies readonly ComponentRenderer[]

const FONT_WEIGHTS = new Set<FontWeight>([100, 200, 300, 400, 500, 600, 700, 800, 900])

const LAYOUT_STYLE_KEYS = new Set([
  'width',
  'height',
  'min_width',
  'max_width',
  'padding',
  'margin',
  'gap',
  'align_items',
  'justify_content',
  'align_self',
])

class ResumeValidationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ResumeValidationError'
  }
}

export function parseResumeJson(
  text: string,
): { ok: true; resume: ResumeDocument } | { ok: false; error: string } {
  try {
    return validateResume(JSON.parse(text) as unknown)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Invalid JSON'
    return { ok: false, error: message }
  }
}

export function validateResume(
  value: unknown,
): { ok: true; resume: ResumeDocument } | { ok: false; error: string } {
  try {
    return { ok: true, resume: readDocument(value) }
  } catch (error) {
    const message = error instanceof ResumeValidationError ? error.message : 'Invalid resume JSON'
    return { ok: false, error: message }
  }
}

function readDocument(value: unknown): ResumeDocument {
  const record = requireRecord(value, 'resume')
  if (record.schema_version !== '2.0') {
    throw new ResumeValidationError('schema_version must be "2.0"')
  }

  const document = requireRecord(record.document, 'document')
  const data = readData(record.data)
  const template = readTemplate(record.template, data)

  return {
    schema_version: '2.0',
    document: {
      id: requireString(document.id, 'document.id'),
      name: requireString(document.name, 'document.name'),
    },
    template,
    data,
  }
}

function readTemplate(value: unknown, data: ResumeData): ResumeTemplate {
  const record = requireRecord(value, 'template')
  const ids = new Set<string>()
  const components = readComponents(record.components)
  const layout = readLayout(record.layout, 'template.layout', ids)
  linkLayout(layout, components, data, [], 'template.layout')

  return {
    page: readPage(record.page),
    theme: readTheme(record.theme),
    layout,
    components,
  }
}

function readPage(value: unknown): PageConfig {
  const record = requireRecord(value, 'template.page')
  return {
    size: oneOf(record.size, ['A4', 'A3', 'A5', 'LETTER', 'LEGAL'] as const, 'template.page.size'),
    orientation: oneOf(
      record.orientation,
      ['portrait', 'landscape'] as const,
      'template.page.orientation',
    ),
    margin: readMargin(record.margin),
  }
}

function readMargin(value: unknown): PageMargin {
  const record = requireRecord(value, 'template.page.margin')
  return {
    top: requireNumber(record.top, 'template.page.margin.top'),
    right: requireNumber(record.right, 'template.page.margin.right'),
    bottom: requireNumber(record.bottom, 'template.page.margin.bottom'),
    left: requireNumber(record.left, 'template.page.margin.left'),
  }
}

function readTheme(value: unknown): ResumeTheme {
  const record = requireRecord(value, 'template.theme')
  const colors = requireRecord(record.colors, 'template.theme.colors')
  const theme: ResumeTheme = {
    font_family: requireString(record.font_family, 'template.theme.font_family'),
    colors: {
      text: requireString(colors.text, 'template.theme.colors.text'),
      muted: requireString(colors.muted, 'template.theme.colors.muted'),
      heading: requireString(colors.heading, 'template.theme.colors.heading'),
      accent: requireString(colors.accent, 'template.theme.colors.accent'),
      border: requireString(colors.border, 'template.theme.colors.border'),
      background: requireString(colors.background, 'template.theme.colors.background'),
    },
  }

  if (record.typography != null) {
    const typography = requireRecord(record.typography, 'template.theme.typography')
    theme.typography = {
      body: readTypography(typography.body, 'template.theme.typography.body'),
      heading: readTypography(typography.heading, 'template.theme.typography.heading'),
      section_heading: readTypography(
        typography.section_heading,
        'template.theme.typography.section_heading',
      ),
    }
  }

  return theme
}

function readTypography(value: unknown, path: string): TypographyStyle | undefined {
  if (value == null) {
    return undefined
  }

  const record = requireRecord(value, path)
  const style: TypographyStyle = {}
  if (record.font_size != null) {
    style.font_size = requireNumber(record.font_size, `${path}.font_size`)
  }
  if (record.font_weight != null) {
    style.font_weight = readFontWeight(record.font_weight, `${path}.font_weight`)
  }
  if (record.line_height != null) {
    style.line_height = requireNumber(record.line_height, `${path}.line_height`)
  }
  if (record.color != null) {
    style.color = requireString(record.color, `${path}.color`)
  }
  if (record.text_transform != null) {
    style.text_transform = oneOf(
      record.text_transform,
      ['none', 'uppercase', 'lowercase', 'capitalize'] as const,
      `${path}.text_transform`,
    )
  }
  return style
}

function readComponents(value: unknown): Record<string, ComponentDefinition> {
  const record = requireRecord(value, 'template.components')
  const components: Record<string, ComponentDefinition> = {}

  for (const [id, component] of Object.entries(record)) {
    components[id] = readComponent(component, `template.components.${id}`)
  }

  return components
}

function readComponent(value: unknown, path: string): ComponentDefinition {
  const record = requireRecord(value, path)
  const component: ComponentDefinition = {
    type: oneOf(record.type, COMPONENT_TYPES, `${path}.type`),
  }

  const binding = readBinding(record.binding, `${path}.binding`)
  if (binding) {
    component.binding = binding
  }
  if (record.renderer != null) {
    component.renderer = oneOf(record.renderer, RENDERERS, `${path}.renderer`)
  }
  const title = optionalString(record.title, `${path}.title`)
  if (title) {
    component.title = title
  }
  const children = readChildren(record.children, `${path}.children`)
  if (children) {
    component.children = children
  }
  const style = readComponentStyle(record.style, `${path}.style`)
  if (style) {
    component.style = style
  }

  return component
}

function readChildren(value: unknown, path: string): ComponentChild[] | undefined {
  if (value == null) {
    return undefined
  }
  if (!Array.isArray(value)) {
    throw new ResumeValidationError(`${path} must be an array`)
  }

  return value.map((child, index) => {
    const record = requireRecord(child, `${path}[${index}]`)
    if (record.type !== 'component') {
      throw new ResumeValidationError(`${path}[${index}].type must be "component"`)
    }

    const component: ComponentChild = {
      type: 'component',
      component_id: requireString(record.component_id, `${path}[${index}].component_id`),
    }
    const binding = readBinding(record.binding, `${path}[${index}].binding`)
    if (binding) {
      component.binding = binding
    }
    const style = readComponentStyle(record.style, `${path}[${index}].style`)
    if (style) {
      component.style = style
    }
    return component
  })
}

function readBinding(value: unknown, path: string): Binding | undefined {
  if (value == null) {
    return undefined
  }

  const record = requireRecord(value, path)
  if (record.source === 'context') {
    const binding: Binding = {
      source: 'context',
      context: requireString(record.context, `${path}.context`),
    }
    const field = optionalString(record.field, `${path}.field`)
    if (field) {
      binding.field = field
    }
    return binding
  }

  if (record.source !== 'data') {
    throw new ResumeValidationError(`${path}.source must be "data" or "context"`)
  }

  if (typeof record.collection === 'string') {
    return {
      source: 'data',
      collection: requireString(record.collection, `${path}.collection`),
    }
  }

  if (typeof record.entity !== 'string') {
    throw new ResumeValidationError(`${path} must include an entity or a collection`)
  }

  const binding: Binding = {
    source: 'data',
    entity: record.entity,
    id: requireString(record.id, `${path}.id`),
  }
  const field = optionalString(record.field, `${path}.field`)
  if (field) {
    binding.field = field
  }
  return binding
}

function readLayout(value: unknown, path: string, ids: Set<string>): LayoutNode {
  const record = requireRecord(value, path)
  const id = requireString(record.id, `${path}.id`)
  if (ids.has(id)) {
    throw new ResumeValidationError(`${path}.id "${id}" is already used in this template`)
  }
  ids.add(id)

  switch (record.type) {
    case 'grid':
      return readGrid(record, id, path, ids)
    case 'component':
      return {
        type: 'component',
        id,
        component_id: requireString(record.component_id, `${path}.component_id`),
        grid: readPlacement(record.grid, `${path}.grid`),
        style: readLayoutStyle(record.style, `${path}.style`),
      }
    case 'repeat':
      return {
        type: 'repeat',
        id,
        binding: readRepeatBinding(record.binding, `${path}.binding`),
        item_id: requireString(record.item_id, `${path}.item_id`),
        children: readRepeatChild(record.children, `${path}.children`, ids),
        style: readLayoutStyle(record.style, `${path}.style`),
      }
    case 'spacer':
      return readSpacer(record, id, path)
    default:
      throw new ResumeValidationError(`${path}.type must be grid, component, repeat, or spacer`)
  }
}

function readGrid(
  record: Record<string, unknown>,
  id: string,
  path: string,
  ids: Set<string>,
): GridNode {
  if (!Array.isArray(record.columns) || record.columns.length === 0) {
    throw new ResumeValidationError(`${path}.columns must be a non-empty array`)
  }
  if (!Array.isArray(record.children)) {
    throw new ResumeValidationError(`${path}.children must be an array`)
  }

  const grid: GridNode = {
    type: 'grid',
    id,
    columns: record.columns.map((column, index) => readTrack(column, `${path}.columns[${index}]`)),
    children: record.children.map((child, index) =>
      readLayout(child, `${path}.children[${index}]`, ids),
    ),
  }

  const rows = readRows(record.rows, `${path}.rows`)
  if (rows) {
    grid.rows = rows
  }
  if (record.gap != null) {
    grid.gap = requireNumber(record.gap, `${path}.gap`)
  }
  const style = readLayoutStyle(record.style, `${path}.style`)
  if (style) {
    grid.style = style
  }
  return grid
}

function readRows(value: unknown, path: string): GridTrack[] | undefined {
  if (value == null || value === 'auto') {
    return undefined
  }
  if (!Array.isArray(value)) {
    throw new ResumeValidationError(`${path} must be an array of track sizes`)
  }
  return value.map((track, index) => readTrack(track, `${path}[${index}]`))
}

function readTrack(value: unknown, path: string): GridTrack {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value
  }
  if (typeof value === 'string' && value.trim() !== '') {
    return value
  }
  throw new ResumeValidationError(`${path} must be a number or a track size such as "1fr" or "30%"`)
}

function readPlacement(value: unknown, path: string) {
  if (value == null) {
    return undefined
  }
  const record = requireRecord(value, path)
  const placement: NonNullable<Extract<LayoutNode, { type: 'component' }>['grid']> = {}
  if (record.column != null) {
    placement.column = requireNumber(record.column, `${path}.column`)
  }
  if (record.row != null) {
    placement.row = requireNumber(record.row, `${path}.row`)
  }
  if (record.column_span != null) {
    placement.column_span = requireNumber(record.column_span, `${path}.column_span`)
  }
  if (record.row_span != null) {
    placement.row_span = requireNumber(record.row_span, `${path}.row_span`)
  }
  return placement
}

function readRepeatBinding(value: unknown, path: string): Extract<Binding, { collection: string }> {
  const binding = readBinding(value, path)
  if (!binding || binding.source !== 'data' || !('collection' in binding)) {
    throw new ResumeValidationError(`${path} must bind a data collection`)
  }
  return binding
}

function readRepeatChild(value: unknown, path: string, ids: Set<string>): LayoutNode {
  if (Array.isArray(value)) {
    throw new ResumeValidationError(`${path} must be a single layout node`)
  }
  return readLayout(value, path, ids)
}

function readSpacer(record: Record<string, unknown>, id: string, path: string): SpacerNode {
  const spacer: SpacerNode = { type: 'spacer', id }
  if (record.size != null) {
    spacer.size = requireNumber(record.size, `${path}.size`)
  }
  const style = readLayoutStyle(record.style, `${path}.style`)
  if (style) {
    spacer.style = style
  }
  return spacer
}

function linkLayout(
  node: LayoutNode,
  components: Record<string, ComponentDefinition>,
  data: ResumeData,
  scope: string[],
  path: string,
) {
  switch (node.type) {
    case 'grid':
      node.children.forEach((child, index) => {
        linkLayout(child, components, data, scope, `${path}.children[${index}]`)
      })
      return
    case 'spacer':
      return
    case 'repeat':
      assertCollection(node.binding.collection, data, `${path}.binding`)
      linkLayout(node.children, components, data, [...scope, node.item_id], `${path}.children`)
      return
    case 'component':
      linkComponent(node.component_id, components, data, scope, `${path}.component_id`, new Set())
      return
    default:
      return
  }
}

function linkComponent(
  id: string,
  components: Record<string, ComponentDefinition>,
  data: ResumeData,
  scope: string[],
  path: string,
  stack: Set<string>,
) {
  if (stack.has(id)) {
    throw new ResumeValidationError(`component "${id}" includes itself`)
  }

  const definition = components[id]
  if (!definition) {
    throw new ResumeValidationError(`${path} references unknown component "${id}"`)
  }

  const next = new Set(stack)
  next.add(id)
  assertBinding(definition.binding, data, scope, `template.components.${id}.binding`)

  for (const [index, child] of (definition.children ?? []).entries()) {
    assertBinding(
      child.binding,
      data,
      scope,
      `template.components.${id}.children[${index}].binding`,
    )
    linkComponent(
      child.component_id,
      components,
      data,
      scope,
      `template.components.${id}.children[${index}].component_id`,
      next,
    )
  }
}

function assertBinding(
  binding: Binding | undefined,
  data: ResumeData,
  scope: string[],
  path: string,
) {
  if (!binding) {
    return
  }

  if (binding.source === 'context') {
    if (!scope.includes(binding.context)) {
      throw new ResumeValidationError(
        `${path} uses context "${binding.context}", which is not created by a parent repeat`,
      )
    }
    return
  }

  if ('collection' in binding) {
    assertCollection(binding.collection, data, path)
    return
  }

  assertEntity(binding, data, path)
}

function assertCollection(name: string, data: ResumeData, path: string) {
  if (!isKnownCollection(data, name)) {
    throw new ResumeValidationError(`${path} collection "${name}" does not exist`)
  }
}

function assertEntity(binding: Extract<Binding, { entity: string }>, data: ResumeData, path: string) {
  if (binding.entity === 'person') {
    if (data.person.id !== binding.id) {
      throw new ResumeValidationError(
        `${path} id "${binding.id}" does not match person "${data.person.id}"`,
      )
    }
    return
  }

  if (binding.entity === 'contact') {
    if (data.contact.id !== binding.id) {
      throw new ResumeValidationError(
        `${path} id "${binding.id}" does not match contact "${data.contact.id}"`,
      )
    }
    return
  }

  if (binding.entity === 'summary') {
    if (!data.summary) {
      throw new ResumeValidationError(`${path} references summary, but data.summary is missing`)
    }
    if (data.summary.id !== binding.id) {
      throw new ResumeValidationError(
        `${path} id "${binding.id}" does not match summary "${data.summary.id}"`,
      )
    }
    return
  }

  if (!isKnownCollection(data, binding.entity) && !data.custom?.[binding.entity]) {
    throw new ResumeValidationError(`${path} entity "${binding.entity}" does not exist`)
  }

  const custom = data.custom?.[binding.entity]
  if (custom?.id === binding.id) {
    return
  }

  const items = custom?.items ?? collectionItems(data, binding.entity)
  if (items.some((item) => isRecord(item) && item.id === binding.id)) {
    return
  }

  throw new ResumeValidationError(
    `${path} id "${binding.id}" was not found in ${binding.entity}`,
  )
}

function collectionItems(data: ResumeData, name: string): unknown[] {
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
      return []
  }
}

function readData(value: unknown): ResumeData {
  const record = requireRecord(value, 'data')
  const data: ResumeData = {
    person: readPerson(record.person),
    contact: readContact(record.contact),
  }

  if (record.summary != null) {
    data.summary = readSummary(record.summary)
  }
  if (record.skills != null) {
    data.skills = readArray(record.skills, 'data.skills', readSkillGroup)
  }
  if (record.languages != null) {
    data.languages = readArray(record.languages, 'data.languages', readLanguage)
  }
  if (record.experience != null) {
    data.experience = readArray(record.experience, 'data.experience', readExperience)
  }
  if (record.projects != null) {
    data.projects = readArray(record.projects, 'data.projects', readProject)
  }
  if (record.education != null) {
    data.education = readArray(record.education, 'data.education', readEducation)
  }
  if (record.certifications != null) {
    data.certifications = readArray(record.certifications, 'data.certifications', readCertification)
  }
  if (record.custom != null) {
    data.custom = readCustom(record.custom)
  }

  return data
}

function readPerson(value: unknown): Person {
  const record = requireRecord(value, 'data.person')
  const person: Person = {
    id: requireString(record.id, 'data.person.id'),
    name: requireString(record.name, 'data.person.name'),
  }
  const headline = optionalString(record.headline, 'data.person.headline')
  if (headline) {
    person.headline = headline
  }
  return person
}

function readContact(value: unknown): Contact {
  const record = requireRecord(value, 'data.contact')
  const contact: Contact = { id: requireString(record.id, 'data.contact.id') }
  const email = optionalString(record.email, 'data.contact.email')
  const phone = optionalString(record.phone, 'data.contact.phone')
  const location = optionalString(record.location, 'data.contact.location')
  if (email) {
    contact.email = email
  }
  if (phone) {
    contact.phone = phone
  }
  if (location) {
    contact.location = location
  }
  if (record.links != null) {
    contact.links = readArray(record.links, 'data.contact.links', readLink)
  }
  return contact
}

function readLink(value: unknown, path: string): ContactLink {
  const record = requireRecord(value, path)
  return {
    id: requireString(record.id, `${path}.id`),
    label: requireString(record.label, `${path}.label`),
    url: requireString(record.url, `${path}.url`),
  }
}

function readSummary(value: unknown): Summary {
  const record = requireRecord(value, 'data.summary')
  return {
    id: requireString(record.id, 'data.summary.id'),
    text: requireString(record.text, 'data.summary.text'),
  }
}

function readSkillGroup(value: unknown, path: string): SkillGroup {
  const record = requireRecord(value, path)
  return {
    id: requireString(record.id, `${path}.id`),
    name: requireString(record.name, `${path}.name`),
    items: readStringArray(record.items, `${path}.items`),
  }
}

function readLanguage(value: unknown, path: string): Language {
  const record = requireRecord(value, path)
  const language: Language = {
    id: requireString(record.id, `${path}.id`),
    name: requireString(record.name, `${path}.name`),
  }
  const level = optionalString(record.level, `${path}.level`)
  if (level) {
    language.level = level
  }
  return language
}

function readExperience(value: unknown, path: string): Experience {
  const record = requireRecord(value, path)
  const experience: Experience = {
    id: requireString(record.id, `${path}.id`),
    company: requireString(record.company, `${path}.company`),
    title: requireString(record.title, `${path}.title`),
  }
  assignOptionalString(experience, 'location', record.location, path)
  assignOptionalString(experience, 'start_date', record.start_date, path)
  assignOptionalString(experience, 'description', record.description, path)
  if ('end_date' in record) {
    experience.end_date = readNullableString(record.end_date, `${path}.end_date`)
  }
  if (record.achievements != null) {
    experience.achievements = readArray(record.achievements, `${path}.achievements`, readAchievement)
  }
  return experience
}

function readProject(value: unknown, path: string): Project {
  const record = requireRecord(value, path)
  const project: Project = {
    id: requireString(record.id, `${path}.id`),
    name: requireString(record.name, `${path}.name`),
  }
  assignOptionalString(project, 'url', record.url, path)
  assignOptionalString(project, 'description', record.description, path)
  if (record.technologies != null) {
    project.technologies = readStringArray(record.technologies, `${path}.technologies`)
  }
  if (record.achievements != null) {
    project.achievements = readArray(record.achievements, `${path}.achievements`, readAchievement)
  }
  return project
}

function readEducation(value: unknown, path: string): Education {
  const record = requireRecord(value, path)
  const education: Education = {
    id: requireString(record.id, `${path}.id`),
    degree: requireString(record.degree, `${path}.degree`),
    institution: requireString(record.institution, `${path}.institution`),
  }
  assignOptionalString(education, 'field', record.field, path)
  assignOptionalString(education, 'location', record.location, path)
  assignOptionalString(education, 'start_date', record.start_date, path)
  assignOptionalString(education, 'description', record.description, path)
  if ('end_date' in record) {
    education.end_date = readNullableString(record.end_date, `${path}.end_date`)
  }
  if (record.achievements != null) {
    education.achievements = readArray(record.achievements, `${path}.achievements`, readAchievement)
  }
  return education
}

function readCertification(value: unknown, path: string): Certification {
  const record = requireRecord(value, path)
  const certification: Certification = {
    id: requireString(record.id, `${path}.id`),
    name: requireString(record.name, `${path}.name`),
  }
  assignOptionalString(certification, 'issuer', record.issuer, path)
  assignOptionalString(certification, 'issue_date', record.issue_date, path)
  assignOptionalString(certification, 'url', record.url, path)
  if ('expiry_date' in record) {
    certification.expiry_date = readNullableString(record.expiry_date, `${path}.expiry_date`)
  }
  return certification
}

function readAchievement(value: unknown, path: string): Achievement {
  const record = requireRecord(value, path)
  return {
    id: requireString(record.id, `${path}.id`),
    text: requireString(record.text, `${path}.text`),
  }
}

function readCustom(value: unknown): Record<string, CustomCollection> {
  const record = requireRecord(value, 'data.custom')
  const custom: Record<string, CustomCollection> = {}
  for (const [key, collection] of Object.entries(record)) {
    custom[key] = readCustomCollection(collection, `data.custom.${key}`)
  }
  return custom
}

function readCustomCollection(value: unknown, path: string): CustomCollection {
  const record = requireRecord(value, path)
  const collection: CustomCollection = {
    id: requireString(record.id, `${path}.id`),
    items: readArray(record.items, `${path}.items`, readCustomItem),
  }
  const title = optionalString(record.title, `${path}.title`)
  if (title) {
    collection.title = title
  }
  return collection
}

function readCustomItem(value: unknown, path: string): CustomItem {
  const record = requireRecord(value, path)
  return {
    ...record,
    id: requireString(record.id, `${path}.id`),
  }
}

function readLayoutStyle(value: unknown, path: string): LayoutStyle | undefined {
  if (value == null) {
    return undefined
  }
  const record = requireRecord(value, path)
  for (const key of Object.keys(record)) {
    if (!LAYOUT_STYLE_KEYS.has(key)) {
      throw new ResumeValidationError(`${path}.${key} is not a supported layout style`)
    }
  }
  return readStyleKeys(record, path)
}

function readComponentStyle(value: unknown, path: string): ComponentStyle | undefined {
  if (value == null) {
    return undefined
  }
  const record = requireRecord(value, path)
  const style = readStyleKeys(record, path)
  if (record.font_family != null) {
    style.font_family = requireString(record.font_family, `${path}.font_family`)
  }
  if (record.font_size != null) {
    style.font_size = requireNumber(record.font_size, `${path}.font_size`)
  }
  if (record.font_weight != null) {
    style.font_weight = readFontWeight(record.font_weight, `${path}.font_weight`)
  }
  if (record.color != null) {
    style.color = requireString(record.color, `${path}.color`)
  }
  if (record.background_color != null) {
    style.background_color = requireString(record.background_color, `${path}.background_color`)
  }
  if (record.line_height != null) {
    style.line_height = requireNumber(record.line_height, `${path}.line_height`)
  }
  if (record.text_align != null) {
    style.text_align = oneOf(record.text_align, ['left', 'center', 'right'] as const, `${path}.text_align`)
  }
  if (record.text_transform != null) {
    style.text_transform = oneOf(
      record.text_transform,
      ['none', 'uppercase', 'lowercase', 'capitalize'] as const,
      `${path}.text_transform`,
    )
  }
  if (record.letter_spacing != null) {
    style.letter_spacing = requireNumber(record.letter_spacing, `${path}.letter_spacing`)
  }
  if (record.border != null) {
    style.border = readBorder(record.border, `${path}.border`)
  }
  if (record.border_bottom != null) {
    style.border_bottom = readBorder(record.border_bottom, `${path}.border_bottom`)
  }
  if (record.border_top != null) {
    style.border_top = readBorder(record.border_top, `${path}.border_top`)
  }
  if (record.border_left != null) {
    style.border_left = readBorder(record.border_left, `${path}.border_left`)
  }
  if (record.border_right != null) {
    style.border_right = readBorder(record.border_right, `${path}.border_right`)
  }

  const known = new Set([
    ...LAYOUT_STYLE_KEYS,
    'font_family',
    'font_size',
    'font_weight',
    'color',
    'background_color',
    'line_height',
    'text_align',
    'text_transform',
    'letter_spacing',
    'border',
    'border_bottom',
    'border_top',
    'border_left',
    'border_right',
  ])
  for (const key of Object.keys(record)) {
    if (!known.has(key)) {
      throw new ResumeValidationError(`${path}.${key} is not a supported style property`)
    }
  }

  return style
}

function readStyleKeys(record: Record<string, unknown>, path: string): ComponentStyle {
  const style: ComponentStyle = {}
  if (record.width != null) {
    style.width = readSize(record.width, `${path}.width`)
  }
  if (record.height != null) {
    style.height = readSize(record.height, `${path}.height`)
  }
  if (record.min_width != null) {
    style.min_width = readSize(record.min_width, `${path}.min_width`)
  }
  if (record.max_width != null) {
    style.max_width = readSize(record.max_width, `${path}.max_width`)
  }
  if (record.padding != null) {
    style.padding = readSpacing(record.padding, `${path}.padding`)
  }
  if (record.margin != null) {
    style.margin = readSpacing(record.margin, `${path}.margin`)
  }
  if (record.gap != null) {
    style.gap = requireNumber(record.gap, `${path}.gap`)
  }
  if (record.align_items != null) {
    style.align_items = oneOf(
      record.align_items,
      ['flex-start', 'center', 'flex-end', 'stretch'] as const,
      `${path}.align_items`,
    )
  }
  if (record.justify_content != null) {
    style.justify_content = oneOf(
      record.justify_content,
      ['flex-start', 'center', 'flex-end', 'space-between', 'space-around'] as const,
      `${path}.justify_content`,
    )
  }
  if (record.align_self != null) {
    style.align_self = oneOf(
      record.align_self,
      ['auto', 'flex-start', 'center', 'flex-end', 'stretch'] as const,
      `${path}.align_self`,
    )
  }
  return style
}

function readBorder(value: unknown, path: string): BorderStyle {
  const record = requireRecord(value, path)
  const border: BorderStyle = {}
  if (record.width != null) {
    border.width = requireNumber(record.width, `${path}.width`)
  }
  if (record.color != null) {
    border.color = requireString(record.color, `${path}.color`)
  }
  if (record.style != null) {
    border.style = oneOf(record.style, ['solid', 'dashed'] as const, `${path}.style`)
  }
  return border
}

function readSpacing(value: unknown, path: string): number | Spacing {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value
  }
  const record = requireRecord(value, path)
  const spacing: Spacing = {}
  for (const side of ['top', 'right', 'bottom', 'left'] as const) {
    if (record[side] != null) {
      spacing[side] = requireNumber(record[side], `${path}.${side}`)
    }
  }
  return spacing
}

function readSize(value: unknown, path: string): string | number {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value
  }
  if (typeof value === 'string') {
    return value
  }
  throw new ResumeValidationError(`${path} must be a string or number`)
}

function readStringArray(value: unknown, path: string): string[] {
  if (!Array.isArray(value)) {
    throw new ResumeValidationError(`${path} must be an array of strings`)
  }
  return value.map((item, index) => requireString(item, `${path}[${index}]`))
}

function readArray<T>(
  value: unknown,
  path: string,
  readItem: (item: unknown, itemPath: string) => T,
): T[] {
  if (!Array.isArray(value)) {
    throw new ResumeValidationError(`${path} must be an array`)
  }
  return value.map((item, index) => readItem(item, `${path}[${index}]`))
}

function readNullableString(value: unknown, path: string): string | null {
  if (value === null) {
    return null
  }
  return requireString(value, path)
}

function assignOptionalString(
  target: { location?: string; start_date?: string; description?: string; field?: string; url?: string; issuer?: string; issue_date?: string },
  key: 'location' | 'start_date' | 'description' | 'field' | 'url' | 'issuer' | 'issue_date',
  value: unknown,
  path: string,
) {
  const text = optionalString(value, `${path}.${key}`)
  if (text) {
    target[key] = text
  }
}

function readFontWeight(value: unknown, path: string): FontWeight {
  if (typeof value === 'number' && FONT_WEIGHTS.has(value as FontWeight)) {
    return value as FontWeight
  }
  throw new ResumeValidationError(`${path} must be a font weight from 100 to 900`)
}

function requireRecord(value: unknown, path: string): Record<string, unknown> {
  if (!isRecord(value)) {
    throw new ResumeValidationError(`${path} must be an object`)
  }
  return value
}

function requireString(value: unknown, path: string): string {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new ResumeValidationError(`${path} must be a non-empty string`)
  }
  return value
}

function optionalString(value: unknown, path: string): string | undefined {
  if (value == null || value === '') {
    return undefined
  }
  if (typeof value !== 'string') {
    throw new ResumeValidationError(`${path} must be a string`)
  }
  return value
}

function requireNumber(value: unknown, path: string): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    throw new ResumeValidationError(`${path} must be a number`)
  }
  return value
}

function oneOf<const T extends string>(value: unknown, allowed: readonly T[], path: string): T {
  if (typeof value === 'string' && (allowed as readonly string[]).includes(value)) {
    return value as T
  }
  throw new ResumeValidationError(`${path} must be one of: ${allowed.join(', ')}`)
}
