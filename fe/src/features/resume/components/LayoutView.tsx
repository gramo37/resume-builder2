import type { ResumeTheme } from '../types/resume'
import type { AbstractNode } from '../resolve/types'
import { componentStyleToCss, gridTemplateColumns, placementStyle } from '../utils/styleToCss'
import { ContentView, isEmptyView } from './ContentView'

type LayoutViewProps = {
  node: AbstractNode
  theme: ResumeTheme
}

export function LayoutView({ node, theme }: LayoutViewProps) {
  switch (node.kind) {
    case 'grid':
      return (
        <div
          style={{
            display: 'grid',
            minWidth: 0,
            ...componentStyleToCss(node.style, theme),
            gridTemplateColumns: gridTemplateColumns(node.columns),
            gridTemplateRows: node.rows?.join(' '),
            ...(node.gap != null ? { gap: node.gap } : {}),
          }}
        >
          {node.children.map((child) => (
            <LayoutView key={child.id} node={child} theme={theme} />
          ))}
        </div>
      )
    case 'stack':
      return (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            minWidth: 0,
            ...componentStyleToCss(node.style, theme),
          }}
        >
          {node.children.map((child) => (
            <LayoutView key={child.id} node={child} theme={theme} />
          ))}
        </div>
      )
    case 'spacer':
      return (
        <div
          style={{
            height: node.size ?? 12,
            ...componentStyleToCss(node.style, theme),
          }}
        />
      )
    case 'component':
      if (isEmptyView(node.view)) {
        return null
      }
      return (
        <div
          style={{
            minWidth: 0,
            ...placementStyle(node.placement),
            ...componentStyleToCss(node.style, theme),
          }}
        >
          <ContentView view={node.view} theme={theme} />
        </div>
      )
    default:
      return null
  }
}
