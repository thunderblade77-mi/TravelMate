import type { ReactNode } from 'react'

type QuickActionButtonProps = {
  label: string
  icon: ReactNode
  onClick?: () => void
}

export function QuickActionButton({ label, icon, onClick }: QuickActionButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex min-h-[7.5rem] flex-col items-start justify-between rounded-2xl border border-slate-100 bg-white p-4 text-left shadow-sm transition active:scale-[0.98] active:bg-slate-50"
    >
      <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
        {icon}
      </span>
      <span className="text-[0.9375rem] font-medium leading-snug text-slate-800">
        {label}
      </span>
    </button>
  )
}
