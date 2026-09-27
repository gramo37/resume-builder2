import type { CSSProperties } from 'react'
import type { Achievement, ComponentStyle, Contact, ResumeTheme } from '../types/resume'
import { formatDateRange, formatResumeDate, joinParts } from '../utils/format'
import { componentStyleToCss, resolveThemeColor } from '../utils/styleToCss'
import type { ResolvedView } from '../resolve/types'
import styles from './ContentView.module.css'

type ContentViewProps = {
  view: ResolvedView
  theme: ResumeTheme
}

export function ContentView({ view, theme }: ContentViewProps) {
  if (isEmptyView(view)) {
    return null
  }

  switch (view.kind) {
    case 'text':
    case 'heading':
      return <TextView view={view} theme={theme} />
    case 'rich_text':
      return (
        <p className={styles.richText} style={componentStyleToCss(view.style, theme)}>
          {view.text}
        </p>
      )
    case 'paragraph':
      return <p style={componentStyleToCss(view.style, theme)}>{view.text}</p>
    case 'divider':
      return <hr className={styles.divider} style={componentStyleToCss(view.style, theme)} />
    case 'spacer':
      return (
        <div
          style={{
            height: view.size ?? 8,
            ...componentStyleToCss(view.style, theme),
          }}
        />
      )
    case 'contact':
      return <ContactView contact={view.contact} style={view.style} theme={theme} />
    case 'list':
      return (
        <div className={styles.entries} style={componentStyleToCss(view.style, theme)}>
          {view.items.map((item, index) => (
            <div key={`${item.id}-${index}`} className={styles.listRow}>
              <span>{item.primary}</span>
              {item.secondary || item.meta ? (
                <span className={styles.entryMeta}>
                  {joinParts([item.secondary, item.meta ? formatResumeDate(item.meta) : undefined])}
                </span>
              ) : null}
            </div>
          ))}
        </div>
      )
    case 'skills':
      return (
        <div className={styles.groups}>
          {view.groups.map((group) => (
            <div key={group.id} className={styles.group}>
              <p className={styles.groupLabel}>{group.name}</p>
              <div className={styles.chips}>
                {group.items.map((item, index) => (
                  <span key={`${item}-${index}`} className={styles.chip}>
                    {item}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      )
    case 'experience':
      return (
        <div className={styles.entries}>
          {view.items.map((item) => (
            <Entry
              key={item.id}
              title={item.title}
              subtitle={joinParts([item.company, item.location])}
              meta={formatDateRange(item.start_date, item.end_date)}
              description={item.description}
              achievements={item.achievements}
            />
          ))}
        </div>
      )
    case 'education':
      return (
        <div className={styles.entries}>
          {view.items.map((item) => (
            <Entry
              key={item.id}
              title={joinParts([item.degree, item.field])}
              subtitle={joinParts([item.institution, item.location])}
              meta={formatDateRange(item.start_date, item.end_date)}
              description={item.description}
              achievements={item.achievements}
            />
          ))}
        </div>
      )
    case 'projects':
      return (
        <div className={styles.entries}>
          {view.items.map((item) => (
            <article key={item.id} className={styles.entry}>
              <p className={styles.entryTitle}>
                {item.url ? (
                  <a href={item.url} style={{ color: theme.colors.accent }} target="_blank" rel="noreferrer">
                    {item.name}
                  </a>
                ) : (
                  item.name
                )}
              </p>
              {item.description ? <p className={styles.body}>{item.description}</p> : null}
              {item.technologies && item.technologies.length > 0 ? (
                <div className={styles.chips}>
                  {item.technologies.map((technology, index) => (
                    <span key={`${technology}-${index}`} className={styles.chip}>
                      {technology}
                    </span>
                  ))}
                </div>
              ) : null}
              <Achievements items={item.achievements} />
            </article>
          ))}
        </div>
      )
    case 'section':
      return <SectionView view={view} theme={theme} />
    case 'empty':
      return null
  }
}

function TextView({
  view,
  theme,
}: {
  view: Extract<ResolvedView, { kind: 'text' | 'heading' }>
  theme: ResumeTheme
}) {
  const css = componentStyleToCss(view.style, theme)
  const prominent = (view.style?.font_size ?? 0) >= 18
  const Tag = prominent ? 'h1' : view.kind === 'heading' ? 'h2' : 'p'
  return <Tag style={css}>{view.text}</Tag>
}

function SectionView({
  view,
  theme,
}: {
  view: Extract<ResolvedView, { kind: 'section' }>
  theme: ResumeTheme
}) {
  const blocks = view.blocks.filter((block) => !isEmptyView(block))
  if (blocks.length === 0) {
    return null
  }

  const box = componentStyleToCss(boxStyle(view.style), theme)
  if (box.gap == null && view.title) {
    box.gap = 8
  }

  return (
    <section
      style={{
        display: 'flex',
        flexDirection: 'column',
        minWidth: 0,
        ...box,
      }}
    >
      {view.title ? (
        <h2 className={styles.title} style={titleStyle(view.style, theme)}>
          {view.title}
        </h2>
      ) : null}
      {blocks.map((block, index) => (
        <ContentView key={index} view={block} theme={theme} />
      ))}
    </section>
  )
}

function ContactView({
  contact,
  style,
  theme,
}: {
  contact: Contact
  style?: ComponentStyle
  theme: ResumeTheme
}) {
  const parts = contactParts(contact)
  if (parts.length === 0) {
    return null
  }

  return (
    <div
      className={styles.contact}
      style={{
        ...componentStyleToCss(style, theme),
        color: style?.color ? resolveThemeColor(style.color, theme) : theme.colors.muted,
      }}
    >
      {parts.map((part, index) => (
        <span key={part.key}>
          {index > 0 ? ' · ' : null}
          {part.href ? (
            <a
              href={part.href}
              style={{ color: theme.colors.accent }}
              target={part.external ? '_blank' : undefined}
              rel={part.external ? 'noreferrer' : undefined}
            >
              {part.label}
            </a>
          ) : (
            part.label
          )}
        </span>
      ))}
    </div>
  )
}

function Entry({
  title,
  subtitle,
  meta,
  description,
  achievements,
}: {
  title: string
  subtitle?: string
  meta?: string
  description?: string
  achievements?: Achievement[]
}) {
  return (
    <article className={styles.entry}>
      <div className={styles.entryHead}>
        <p className={styles.entryTitle}>{title}</p>
        {meta ? <p className={styles.entryMeta}>{meta}</p> : null}
      </div>
      {subtitle ? <p className={styles.entrySub}>{subtitle}</p> : null}
      {description ? <p className={styles.body}>{description}</p> : null}
      <Achievements items={achievements} />
    </article>
  )
}

function Achievements({ items }: { items?: Achievement[] }) {
  if (!items?.length) {
    return null
  }

  return (
    <div className={styles.bullets}>
      {items.map((item) => (
        <p key={item.id} className={styles.bullet}>
          {item.text}
        </p>
      ))}
    </div>
  )
}

function contactParts(contact: Contact) {
  const parts: Array<{ key: string; label: string; href?: string; external?: boolean }> = []

  if (contact.email) {
    parts.push({ key: 'email', label: contact.email, href: `mailto:${contact.email}` })
  }
  if (contact.phone) {
    parts.push({
      key: 'phone',
      label: contact.phone,
      href: `tel:${contact.phone.replace(/[^\d+]/g, '')}`,
    })
  }
  if (contact.location) {
    parts.push({ key: 'location', label: contact.location })
  }
  for (const link of contact.links ?? []) {
    parts.push({ key: link.id, label: link.label, href: link.url, external: true })
  }

  return parts
}

function boxStyle(style?: ComponentStyle): ComponentStyle | undefined {
  if (!style) {
    return undefined
  }

  const next: ComponentStyle = { ...style }
  delete next.color
  delete next.font_size
  delete next.font_weight
  delete next.text_transform
  delete next.border
  delete next.border_bottom
  delete next.border_top
  delete next.border_left
  delete next.border_right
  return next
}

function titleStyle(style: ComponentStyle | undefined, theme: ResumeTheme): CSSProperties {
  const heading = theme.typography?.section_heading
  const css: CSSProperties = {}
  const color = style?.color ?? heading?.color
  if (color) {
    css.color = resolveThemeColor(color, theme)
  }
  const transform = style?.text_transform ?? heading?.text_transform
  if (transform) {
    css.textTransform = transform
  }
  if (style?.border_bottom) {
    css.borderBottom = componentStyleToCss({ border_bottom: style.border_bottom }, theme).borderBottom
  }
  const fontSize = style?.font_size ?? heading?.font_size
  if (fontSize != null) {
    css.fontSize = fontSize
  }
  const fontWeight = style?.font_weight ?? heading?.font_weight
  if (fontWeight != null) {
    css.fontWeight = fontWeight
  }
  return css
}

export function isEmptyView(view: ResolvedView): boolean {
  switch (view.kind) {
    case 'empty':
      return true
    case 'text':
    case 'heading':
    case 'rich_text':
    case 'paragraph':
      return view.text.trim() === ''
    case 'list':
      return view.items.length === 0
    case 'experience':
    case 'education':
    case 'projects':
      return view.items.length === 0
    case 'skills':
      return view.groups.length === 0
    case 'contact':
      return contactParts(view.contact).length === 0
    case 'section':
      return view.blocks.every(isEmptyView)
    default:
      return false
  }
}
