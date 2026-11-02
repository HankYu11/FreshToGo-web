/**
 * The handful of glyphs the flow needs, inline so the webview makes no extra requests
 * and nothing depends on an icon font loading.
 */

interface IconProps {
  size?: number
  className?: string
}

function base(size: number) {
  return {
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    fill: 'none' as const,
    stroke: 'currentColor',
    strokeWidth: 1.8,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    'aria-hidden': true,
  }
}

export function ChevronLeftIcon({ size = 24, className }: IconProps) {
  return (
    <svg {...base(size)} className={className}>
      <path d="m15 18-6-6 6-6" />
    </svg>
  )
}

export function ChevronRightIcon({ size = 20, className }: IconProps) {
  return (
    <svg {...base(size)} className={className}>
      <path d="m9 18 6-6-6-6" />
    </svg>
  )
}

export function ClockIcon({ size = 16, className }: IconProps) {
  return (
    <svg {...base(size)} className={className}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </svg>
  )
}

export function WalkIcon({ size = 16, className }: IconProps) {
  return (
    <svg {...base(size)} className={className}>
      <circle cx="13" cy="4" r="1.6" />
      <path d="m9 21 2-6 3-2-1-5-4 2-1 3" />
      <path d="m13 13 2 3 2 4" />
    </svg>
  )
}

export function PinIcon({ size = 16, className }: IconProps) {
  return (
    <svg {...base(size)} className={className}>
      <path d="M12 21s7-5.5 7-11a7 7 0 1 0-14 0c0 5.5 7 11 7 11Z" />
      <circle cx="12" cy="10" r="2.5" />
    </svg>
  )
}

export function WalletIcon({ size = 24, className }: IconProps) {
  return (
    <svg {...base(size)} className={className}>
      <path d="M3 8a2 2 0 0 1 2-2h13a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z" />
      <path d="M16 12h2.5" />
    </svg>
  )
}

export function CloudOffIcon({ size = 32, className }: IconProps) {
  return (
    <svg {...base(size)} className={className}>
      <path d="M3 3l18 18" />
      <path d="M8.5 8.2A5 5 0 0 1 17 11h.5a3.5 3.5 0 0 1 2.6 5.8" />
      <path d="M16.5 19H7a4 4 0 0 1-.9-7.9" />
    </svg>
  )
}

export function AlertIcon({ size = 32, className }: IconProps) {
  return (
    <svg {...base(size)} className={className}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 8v5M12 16.5v.01" />
    </svg>
  )
}

export function BoxIcon({ size = 32, className }: IconProps) {
  return (
    <svg {...base(size)} className={className}>
      <path d="M3.5 8.5 12 4l8.5 4.5V16L12 20.5 3.5 16Z" />
      <path d="M3.5 8.5 12 13l8.5-4.5M12 13v7.5" />
    </svg>
  )
}

export function CheckIcon({ size = 20, className }: IconProps) {
  return (
    <svg {...base(size)} className={className}>
      <path d="m5 12.5 4.5 4.5L19 7" />
    </svg>
  )
}
