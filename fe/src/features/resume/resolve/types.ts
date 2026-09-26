import type {
  ComponentStyle,
  Contact,
  Education,
  Experience,
  GridPlacement,
  LayoutStyle,
  Project,
  SkillGroup,
} from '../types/resume'

export type ListEntry = {
  id: string
  primary: string
  secondary?: string
  meta?: string
}

export type ResolvedView =
  | { kind: 'text'; text: string; style?: ComponentStyle }
  | { kind: 'heading'; text: string; style?: ComponentStyle }
  | { kind: 'rich_text'; text: string; style?: ComponentStyle }
  | { kind: 'paragraph'; text: string; style?: ComponentStyle }
  | { kind: 'divider'; style?: ComponentStyle }
  | { kind: 'spacer'; size?: number; style?: ComponentStyle }
  | { kind: 'contact'; contact: Contact; style?: ComponentStyle }
  | { kind: 'list'; items: ListEntry[]; style?: ComponentStyle }
  | { kind: 'experience'; items: Experience[]; style?: ComponentStyle }
  | { kind: 'education'; items: Education[]; style?: ComponentStyle }
  | { kind: 'projects'; items: Project[]; style?: ComponentStyle }
  | { kind: 'skills'; groups: SkillGroup[]; style?: ComponentStyle }
  | { kind: 'section'; title?: string; style?: ComponentStyle; blocks: ResolvedView[] }
  | { kind: 'empty' }

export type AbstractNode =
  | {
      kind: 'grid'
      id: string
      columns: string[]
      rows?: string[]
      gap?: number
      style?: LayoutStyle
      children: AbstractNode[]
    }
  | {
      kind: 'stack'
      id: string
      style?: LayoutStyle
      children: AbstractNode[]
    }
  | {
      kind: 'spacer'
      id: string
      size?: number
      style?: LayoutStyle
    }
  | {
      kind: 'component'
      id: string
      placement?: GridPlacement
      style?: LayoutStyle
      view: ResolvedView
    }

export type RenderContext = Record<string, unknown>
