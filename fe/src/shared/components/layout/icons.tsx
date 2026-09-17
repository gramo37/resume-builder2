import type { ReactNode } from 'react'
import type { SidebarIconName } from '@/app/layouts/nav'

type IconProps = {
  name: SidebarIconName
}

function Svg({ children }: { children: ReactNode }) {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {children}
    </svg>
  )
}

export function SidebarIcon({ name }: IconProps) {
  switch (name) {
    case 'home':
      return (
        <Svg>
          <path d="M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-5v-6H10v6H5a1 1 0 0 1-1-1z" />
        </Svg>
      )
    case 'automations':
      return (
        <Svg>
          <path d="M5 7h8" />
          <path d="M5 12h5" />
          <path d="M5 17h8" />
          <circle cx="17.5" cy="7" r="2" />
          <circle cx="13.5" cy="12" r="2" />
          <circle cx="17.5" cy="17" r="2" />
        </Svg>
      )
    case 'jobs':
      return (
        <Svg>
          <rect x="3" y="7" width="18" height="13" rx="2" />
          <path d="M8 7V5.8A1.8 1.8 0 0 1 9.8 4h4.4A1.8 1.8 0 0 1 16 5.8V7" />
          <path d="M3 13h18" />
        </Svg>
      )
    case 'people':
      return (
        <Svg>
          <circle cx="9" cy="8" r="3" />
          <path d="M3.5 19a5.5 5.5 0 0 1 11 0" />
          <circle cx="17" cy="9" r="2.4" />
          <path d="M16 19c.2-1.8 1.3-3.3 3.4-4" />
        </Svg>
      )
    case 'integrations':
      return (
        <Svg>
          <path d="M9 8V5.5A2.5 2.5 0 0 1 11.5 3h1A2.5 2.5 0 0 1 15 5.5V8" />
          <path d="M9 16v2.5A2.5 2.5 0 0 0 11.5 21h1A2.5 2.5 0 0 0 15 18.5V16" />
          <rect x="7" y="8" width="10" height="8" rx="2" />
        </Svg>
      )
  }
}

export function MenuIcon() {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      aria-hidden="true"
    >
      <path d="M4 7h16M4 12h16M4 17h16" />
    </svg>
  )
}
