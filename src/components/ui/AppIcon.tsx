import type { ReactNode } from 'react'

type IconName =
  | 'home'
  | 'trips'
  | 'map'
  | 'weather'
  | 'sparkles'
  | 'book'
  | 'ticket'
  | 'wallet'
  | 'users'
  | 'check'
  | 'user'
  | 'plus'
  | 'logout'
  | 'navigation'
  | 'pin'

type AppIconProps = {
  name: IconName
  className?: string
  strokeWidth?: number
}

const paths: Record<IconName, ReactNode> = {
  home: <><path d="M3 10.8 12 3l9 7.8"/><path d="M5.5 9.8V21h13V9.8"/><path d="M9.5 21v-6h5v6"/></>,
  trips: <><rect x="4" y="6" width="16" height="14" rx="3"/><path d="M9 6V4.8A1.8 1.8 0 0 1 10.8 3h2.4A1.8 1.8 0 0 1 15 4.8V6"/><path d="M4 12h16"/><path d="M9 10v4M15 10v4"/></>,
  map: <><path d="m3.5 6.5 5-2 7 2 5-2v13l-5 2-7-2-5 2z"/><path d="M8.5 4.5v13M15.5 6.5v13"/></>,
  weather: <><path d="M6.5 17.5h10a4 4 0 0 0 .3-8 5.5 5.5 0 0 0-10.5 1.7A3.2 3.2 0 0 0 6.5 17.5Z"/><path d="M8 20.5h8"/></>,
  sparkles: <><path d="m12 3 1.4 4.1L17.5 8.5l-4.1 1.4L12 14l-1.4-4.1-4.1-1.4 4.1-1.4z"/><path d="m18.5 14.5.7 2.1 2.1.7-2.1.7-.7 2.1-.7-2.1-2.1-.7 2.1-.7z"/><path d="m5 15 .8 2.2L8 18l-2.2.8L5 21l-.8-2.2L2 18l2.2-.8z"/></>,
  book: <><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H11v16H6.5A2.5 2.5 0 0 0 4 21.5z"/><path d="M20 5.5A2.5 2.5 0 0 0 17.5 3H13v16h4.5a2.5 2.5 0 0 1 2.5 2.5z"/></>,
  ticket: <><path d="M4 7a2 2 0 0 0 2-2h12a2 2 0 0 0 2 2v2a3 3 0 0 0 0 6v2a2 2 0 0 0-2 2H6a2 2 0 0 0-2-2v-2a3 3 0 0 0 0-6z"/><path d="M12 7v2M12 11v2M12 15v2"/></>,
  wallet: <><path d="M4 7.5A2.5 2.5 0 0 1 6.5 5H18a2 2 0 0 1 2 2v12H6.5A2.5 2.5 0 0 1 4 16.5z"/><path d="M4 9h14.5A2.5 2.5 0 0 1 21 11.5V15h-6a2 2 0 0 1 0-4h6"/><circle cx="16" cy="13" r=".6" fill="currentColor" stroke="none"/></>,
  users: <><circle cx="9" cy="8" r="3"/><path d="M3.5 20a5.5 5.5 0 0 1 11 0"/><circle cx="17" cy="9" r="2.3"/><path d="M15.5 15.2A4.5 4.5 0 0 1 21 19.5"/></>,
  check: <><rect x="4" y="4" width="16" height="16" rx="4"/><path d="m8 12 2.6 2.6L16.5 9"/></>,
  user: <><circle cx="12" cy="8" r="4"/><path d="M4.5 21a7.5 7.5 0 0 1 15 0"/></>,
  plus: <path d="M12 5v14M5 12h14"/>,
  logout: <><path d="M10 5H6a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h4"/><path d="m14 8 4 4-4 4M9 12h9"/></>,
  navigation: <path d="m20 4-7.3 16-2-6.7L4 11.3z"/>,
  pin: <><path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="2.5"/></>,
}

export default function AppIcon({
  name,
  className = 'h-5 w-5',
  strokeWidth = 1.8,
}: AppIconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {paths[name]}
    </svg>
  )
}

export type { IconName }
