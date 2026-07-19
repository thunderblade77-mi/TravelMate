import type { ReactNode } from 'react'
import { HomeIcon, MapIcon, SuitcaseIcon, UserIcon } from '../icons'

export type BottomNavItem = 'home' | 'trip' | 'map' | 'profile'

type NavItem = {
  id: BottomNavItem
  label: string
  icon: ReactNode
}

const navItems: NavItem[] = [
  { id: 'home', label: 'Home', icon: <HomeIcon className="h-6 w-6" /> },
  { id: 'trip', label: 'Viaggio', icon: <SuitcaseIcon className="h-6 w-6" /> },
  { id: 'map', label: 'Mappa', icon: <MapIcon className="h-6 w-6" /> },
  { id: 'profile', label: 'Profilo', icon: <UserIcon className="h-6 w-6" /> },
]

type BottomNavProps = {
  activeItem?: BottomNavItem
}

export function BottomNav({ activeItem = 'home' }: BottomNavProps) {
  return (
    <nav
      aria-label="Navigazione principale"
      className="fixed inset-x-0 bottom-0 z-10 mx-auto w-full max-w-md border-t border-slate-200 bg-white/95 px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2 backdrop-blur-sm"
    >
      <ul className="grid grid-cols-4">
        {navItems.map((item) => {
          const isActive = item.id === activeItem

          return (
            <li key={item.id}>
              <button
                type="button"
                aria-current={isActive ? 'page' : undefined}
                className={`flex w-full flex-col items-center gap-1 rounded-xl px-2 py-2 text-xs font-medium transition active:bg-slate-50 ${
                  isActive ? 'text-brand-600' : 'text-slate-400'
                }`}
              >
                {item.icon}
                <span>{item.label}</span>
              </button>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
