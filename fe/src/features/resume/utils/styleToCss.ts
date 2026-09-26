import type { CSSProperties } from 'react'
import type { BorderStyle, ComponentStyle, GridPlacement, LayoutStyle, ResumeTheme, Spacing } from '../types/resume'

export function resolveThemeColor(color: string | undefined, theme: ResumeTheme): string | undefined {
  if (!color) {
    return undefined
  }

  if (color.startsWith('theme.')) {
    const token = color.slice('theme.'.length)
    if (token in theme.colors) {
      return theme.colors[token as keyof ResumeTheme['colors']]
    }
  }

  return color
}

export function componentStyleToCss(
  style: ComponentStyle | LayoutStyle | undefined,
  theme: ResumeTheme,
): CSSProperties {
  if (!style) {
    return {}
  }

  const css: CSSProperties = {}
  const component = style as ComponentStyle

  if (component.font_family) {
    css.fontFamily = component.font_family
  }
  if (component.font_size != null) {
    css.fontSize = component.font_size
  }
  if (component.font_weight != null) {
    css.fontWeight = component.font_weight
  }
  if (component.color) {
    css.color = resolveThemeColor(component.color, theme)
  }
  if (component.background_color) {
    css.backgroundColor = resolveThemeColor(component.background_color, theme)
  }
  if (component.line_height != null) {
    css.lineHeight = component.line_height
  }
  if (component.text_align) {
    css.textAlign = component.text_align
  }
  if (component.text_transform) {
    css.textTransform = component.text_transform
  }
  if (component.letter_spacing != null) {
    css.letterSpacing = component.letter_spacing
  }
  if (style.width != null) {
    css.width = toCssSize(style.width)
  }
  if (style.height != null) {
    css.height = toCssSize(style.height)
  }
  if (style.min_width != null) {
    css.minWidth = toCssSize(style.min_width)
  }
  if (style.max_width != null) {
    css.maxWidth = toCssSize(style.max_width)
  }
  if (style.padding != null) {
    css.padding = toCssSpacing(style.padding)
  }
  if (style.margin != null) {
    css.margin = toCssSpacing(style.margin)
  }
  if (style.gap != null) {
    css.gap = style.gap
  }
  if (style.align_items) {
    css.alignItems = style.align_items
  }
  if (style.justify_content) {
    css.justifyContent = style.justify_content
  }
  if (style.align_self) {
    css.alignSelf = style.align_self
  }

  const border = toCssBorder(component.border, theme)
  if (border) {
    css.border = border
  }
  const borderBottom = toCssBorder(component.border_bottom, theme)
  if (borderBottom) {
    css.borderBottom = borderBottom
  }
  const borderTop = toCssBorder(component.border_top, theme)
  if (borderTop) {
    css.borderTop = borderTop
  }
  const borderLeft = toCssBorder(component.border_left, theme)
  if (borderLeft) {
    css.borderLeft = borderLeft
  }
  const borderRight = toCssBorder(component.border_right, theme)
  if (borderRight) {
    css.borderRight = borderRight
  }

  return css
}

export function placementStyle(placement?: GridPlacement): CSSProperties {
  if (!placement) {
    return {}
  }

  const css: CSSProperties = {}
  if (placement.column != null || placement.column_span != null) {
    const span = placement.column_span ?? 1
    css.gridColumn = placement.column != null ? `${placement.column} / span ${span}` : `span ${span}`
  }
  if (placement.row != null || placement.row_span != null) {
    const span = placement.row_span ?? 1
    css.gridRow = placement.row != null ? `${placement.row} / span ${span}` : `span ${span}`
  }
  return css
}

export function gridTemplateColumns(columns: string[]): string {
  const ratios = columns.map((column) => {
    const match = /^(\d+(?:\.\d+)?)%$/.exec(column.trim())
    return match ? Number(match[1]) : null
  })

  if (ratios.every((ratio) => ratio != null)) {
    return ratios.map((ratio) => `minmax(0, ${ratio}fr)`).join(' ')
  }

  return columns.map(softenTrack).join(' ')
}

export function fontFamily(name: string): string {
  if (name.includes(',')) {
    return name
  }
  return `"${name}", sans-serif`
}

function softenTrack(track: string): string {
  const value = track.trim()
  if (/^\d+(?:\.\d+)?fr$/.test(value)) {
    return `minmax(0, ${value})`
  }
  return value
}

function toCssSize(value: string | number): string | number {
  return typeof value === 'number' ? value : value
}

function toCssSpacing(value: number | Spacing): string | number {
  if (typeof value === 'number') {
    return value
  }
  return `${value.top ?? 0}px ${value.right ?? 0}px ${value.bottom ?? 0}px ${value.left ?? 0}px`
}

function toCssBorder(border: BorderStyle | undefined, theme: ResumeTheme): string | undefined {
  if (!border) {
    return undefined
  }
  const width = border.width ?? 1
  const style = border.style ?? 'solid'
  const color = resolveThemeColor(border.color, theme) ?? theme.colors.border
  return `${width}px ${style} ${color}`
}
