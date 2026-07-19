import type { SVGProps } from 'react'

type IconProps = SVGProps<SVGSVGElement>

const baseProps: IconProps = {
  fill: 'none',
  viewBox: '0 0 24 24',
  stroke: 'currentColor',
  strokeWidth: 1.75,
  'aria-hidden': true,
}

export function MapPinIcon(props: IconProps) {
  return (
    <svg {...baseProps} {...props}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z"
      />
    </svg>
  )
}

export function PlayIcon(props: IconProps) {
  return (
    <svg {...baseProps} {...props}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.347a1.125 1.125 0 0 1 0 1.972l-11.54 6.347a1.125 1.125 0 0 1-1.667-.986V5.653Z"
      />
    </svg>
  )
}

export function LocationIcon(props: IconProps) {
  return (
    <svg {...baseProps} {...props}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9 6.75V15m6-6v8.25m.503 3.498 4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934a1.125 1.125 0 0 1-1.006 0l-3.869-1.934A1.125 1.125 0 0 0 7.5 4.82v11.502c0 .836.88 1.38 1.628 1.006l3.869-1.934a1.125 1.125 0 0 1 1.006 0Z"
      />
    </svg>
  )
}

export function WalletIcon(props: IconProps) {
  return (
    <svg {...baseProps} {...props}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M21 12a2.25 2.25 0 0 0-2.25-2.25H15a3 3 0 1 1-6 0H5.25A2.25 2.25 0 0 0 3 12m18 0v6a2.25 2.25 0 0 1-2.25 2.25H5.25A2.25 2.25 0 0 1 3 18v-6m18 0V9M3 12V9m18 0a2.25 2.25 0 0 0-2.25-2.25H5.25A2.25 2.25 0 0 0 3 9m18 0V6a2.25 2.25 0 0 0-2.25-2.25H5.25A2.25 2.25 0 0 0 3 6v3"
      />
    </svg>
  )
}

export function BookIcon(props: IconProps) {
  return (
    <svg {...baseProps} {...props}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.148 0-2.311.22-3.375.634a1.125 1.125 0 0 0-.375 1.056v11.25c0 .626.506 1.125 1.125 1.125h.375m12-1.125V4.875A1.125 1.125 0 0 0 18.375 3.75c-1.148 0-2.311.22-3.375.634m0 0A8.967 8.967 0 0 1 12 6.042m0 0v11.25"
      />
    </svg>
  )
}

export function HomeIcon(props: IconProps) {
  return (
    <svg {...baseProps} {...props}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25"
      />
    </svg>
  )
}

export function SuitcaseIcon(props: IconProps) {
  return (
    <svg {...baseProps} {...props}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M20.25 7.5v9a2.25 2.25 0 0 1-2.25 2.25H6a2.25 2.25 0 0 1-2.25-2.25v-9M9.75 7.5V5.625A2.625 2.625 0 0 1 12.375 3h.75a2.625 2.625 0 0 1 2.625 2.625V7.5M12 12h.008v.008H12V12Z"
      />
    </svg>
  )
}

export function MapIcon(props: IconProps) {
  return (
    <svg {...baseProps} {...props}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9 6.75V15m6-6v8.25m.503 3.498 4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934a1.125 1.125 0 0 1-1.006 0l-3.869-1.934A1.125 1.125 0 0 0 7.5 4.82v11.502c0 .836.88 1.38 1.628 1.006l3.869-1.934a1.125 1.125 0 0 1 1.006 0Z"
      />
    </svg>
  )
}

export function UserIcon(props: IconProps) {
  return (
    <svg {...baseProps} {...props}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z"
      />
    </svg>
  )
}
