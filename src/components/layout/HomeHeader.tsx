import { TravelMateLogo } from '../ui/TravelMateLogo'
import { UserIcon } from '../icons'

const APP_NAME = 'TravelG'

export function HomeHeader() {
  return (
    <header className="flex items-center justify-between pb-6">
      <div className="flex items-center gap-3">
        <TravelMateLogo size="sm" />
        <span className="text-lg font-semibold tracking-tight text-slate-900">
          {APP_NAME}
        </span>
      </div>

      <button
        type="button"
        aria-label="Profilo"
        className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-sm transition active:bg-slate-50"
      >
        <UserIcon className="h-5 w-5" />
      </button>
    </header>
  )
}