import { MapPinIcon } from '../icons'

type TravelMateLogoProps = {
  size?: 'sm' | 'md'
  className?: string
}

const sizes = {
  sm: { box: 'h-9 w-9', icon: 'h-5 w-5' },
  md: { box: 'h-11 w-11', icon: 'h-6 w-6' },
} as const

export function TravelMateLogo({ size = 'sm', className = '' }: TravelMateLogoProps) {
  const { box, icon } = sizes[size]

  return (
    <div
      className={`flex shrink-0 items-center justify-center rounded-xl bg-brand-600 shadow-sm shadow-brand-600/20 ${box} ${className}`}
    >
      <MapPinIcon className={`text-white ${icon}`} />
    </div>
  )
}
