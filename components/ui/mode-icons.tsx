import type React from "react"

type SVGProps = React.SVGProps<SVGSVGElement>

// Nebula — concentric dashed rings around a star core
export function NebulaIcon(p: SVGProps) {
  return (
    <svg viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <circle cx="9" cy="9" r="1.5" fill="currentColor" stroke="none" />
      <circle cx="9" cy="9" r="4" strokeWidth="1.2" strokeDasharray="2.2 1.6" />
      <circle cx="9" cy="9" r="7" strokeWidth="1" strokeDasharray="1.5 2" />
    </svg>
  )
}

// Black Hole — flat accretion disk + dark core
export function BlackHoleIcon(p: SVGProps) {
  return (
    <svg viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <ellipse cx="9" cy="9" rx="7.5" ry="2.8" strokeWidth="1.3" />
      <ellipse cx="9" cy="9" rx="7.5" ry="2.8" strokeWidth="1" strokeDasharray="3 2.5" opacity="0.45" />
      <circle cx="9" cy="9" r="2.8" fill="currentColor" stroke="none" />
    </svg>
  )
}

// Ripple — water drop + spreading arcs
export function RippleIcon(p: SVGProps) {
  return (
    <svg viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <path d="M9 2 C10.8 4.5 12 6.2 12 7.8 A3 3 0 0 1 6 7.8 C6 6.2 7.2 4.5 9 2 Z" fill="currentColor" stroke="none" />
      <path d="M4 12.5 Q9 10.5 14 12.5" strokeWidth="1.4" />
      <path d="M2 15.5 Q9 13 16 15.5" strokeWidth="1" opacity="0.55" />
    </svg>
  )
}

// Gravity Dojo — planet with curved orbital arc (gravity well)
export function GravityIcon(p: SVGProps) {
  return (
    <svg viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <circle cx="9" cy="9" r="2.5" strokeWidth="1.4" />
      <path d="M2 9 C3 4.5 6.5 3 9 4 C11.5 5 14.5 8.5 16 9" strokeWidth="1.3" />
      <path d="M2 9 C3 13.5 6.5 15 9 14 C11.5 13 14.5 9.5 16 9" strokeWidth="1.3" />
    </svg>
  )
}

// Lava Lamp — two blobs separated by a neck
export function LavaLampIcon(p: SVGProps) {
  return (
    <svg viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <path d="M9 1.5 C12.5 1.5 14 3.5 14 6 C14 8.5 12 9.5 9 9.5 C6 9.5 4 8.5 4 6 C4 3.5 5.5 1.5 9 1.5 Z" strokeWidth="1.4" />
      <path d="M7 9.5 C7 9.5 6 9.8 6 11 C6 12.5 7.2 13 9 13 C10.8 13 12 12.5 12 11 C12 9.8 11 9.5 11 9.5" strokeWidth="1.4" />
      <ellipse cx="9" cy="15" rx="3" ry="1.8" strokeWidth="1.4" />
    </svg>
  )
}

// Sand — hourglass with sand grains in the bottom half
export function SandIcon(p: SVGProps) {
  return (
    <svg viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <path d="M5 2.5 H13 L9 9 L13 15.5 H5 L9 9 Z" strokeWidth="1.4" />
      <line x1="4.5" y1="2.5" x2="13.5" y2="2.5" strokeWidth="1.4" />
      <line x1="4.5" y1="15.5" x2="13.5" y2="15.5" strokeWidth="1.4" />
      <circle cx="8.2" cy="12" r="0.7" fill="currentColor" stroke="none" />
      <circle cx="10" cy="13" r="0.7" fill="currentColor" stroke="none" />
      <circle cx="9" cy="11" r="0.7" fill="currentColor" stroke="none" />
    </svg>
  )
}

// Kaleidoscope — asterisk with a circle ring
export function KaleidoscopeIcon(p: SVGProps) {
  return (
    <svg viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <line x1="9" y1="2" x2="9" y2="16" strokeWidth="1.3" />
      <line x1="2" y1="9" x2="16" y2="9" strokeWidth="1.3" />
      <line x1="3.9" y1="3.9" x2="14.1" y2="14.1" strokeWidth="1.3" />
      <line x1="14.1" y1="3.9" x2="3.9" y2="14.1" strokeWidth="1.3" />
      <circle cx="9" cy="9" r="3.5" strokeWidth="1.3" />
    </svg>
  )
}

// Liquid — three flowing sine waves
export function LiquidIcon(p: SVGProps) {
  return (
    <svg viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <path d="M1.5 5.5 C4 4 5.5 7 9 5.5 C12.5 4 14 7 16.5 5.5" strokeWidth="1.4" />
      <path d="M1.5 9 C4 7.5 5.5 10.5 9 9 C12.5 7.5 14 10.5 16.5 9" strokeWidth="1.4" />
      <path d="M1.5 12.5 C4 11 5.5 14 9 12.5 C12.5 11 14 14 16.5 12.5" strokeWidth="1.4" />
    </svg>
  )
}

// Vibe Room — music equalizer bars
export function VibeIcon(p: SVGProps) {
  return (
    <svg viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeLinecap="round" {...p}>
      <line x1="2.5" y1="15" x2="2.5" y2="7.5" strokeWidth="2" />
      <line x1="6.5" y1="15" x2="6.5" y2="3.5" strokeWidth="2" />
      <line x1="10.5" y1="15" x2="10.5" y2="6" strokeWidth="2" />
      <line x1="14.5" y1="15" x2="14.5" y2="10" strokeWidth="2" />
    </svg>
  )
}

// Rain on Glass — drop with sliding trail
export function RainIcon(p: SVGProps) {
  return (
    <svg viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <path d="M9 2.5 C10.4 4.2 11.2 5.5 11.2 6.8 A2.2 2.2 0 0 1 6.8 6.8 C6.8 5.5 7.6 4.2 9 2.5 Z" fill="currentColor" stroke="none" />
      <line x1="9" y1="9.5" x2="8.4" y2="15" strokeWidth="1.3" opacity="0.55" />
      <line x1="3" y1="10" x2="15" y2="10" strokeWidth="1" opacity="0.3" />
      <circle cx="4.5" cy="13.5" r="1" fill="currentColor" stroke="none" opacity="0.6" />
      <circle cx="13" cy="12" r="0.8" fill="currentColor" stroke="none" opacity="0.45" />
    </svg>
  )
}

// Hydro — liquid wave with gravity arrow
export function AuroraIcon(p: SVGProps) {
  return (
    <svg viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <line x1="9" y1="1.5" x2="9" y2="5.5" strokeWidth="1.3" />
      <path d="M7 4 L9 6.5 L11 4" strokeWidth="1.3" />
      <path d="M1.5 11 C4 9 6.5 13 9.5 11 C12.5 9 14.5 12 16.5 10.5" strokeWidth="1.5" />
      <path d="M1.5 11 C4 13 6.5 9 9.5 11 C12.5 13 14.5 10 16.5 11.5 L16.5 16.5 L1.5 16.5 Z"
        fill="currentColor" stroke="none" opacity="0.28" />
    </svg>
  )
}

// Bioluminescent Tide — glowing dots in dark water
export function BiolumIcon(p: SVGProps) {
  return (
    <svg viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeLinecap="round" {...p}>
      <circle cx="6"  cy="11" r="1.4" fill="currentColor" stroke="none" />
      <circle cx="6"  cy="11" r="3.2" strokeWidth="0.8" opacity="0.35" />
      <circle cx="12" cy="7"  r="1.1" fill="currentColor" stroke="none" />
      <circle cx="12" cy="7"  r="2.7" strokeWidth="0.8" opacity="0.30" />
      <circle cx="14" cy="13" r="0.8" fill="currentColor" stroke="none" opacity="0.7" />
      <circle cx="3.5" cy="5.5" r="0.7" fill="currentColor" stroke="none" opacity="0.5" />
      <circle cx="9" cy="14.5" r="0.6" fill="currentColor" stroke="none" opacity="0.4" />
    </svg>
  )
}

// Soap Bubbles — two iridescent spheres with specular arc
export function BubblesIcon(p: SVGProps) {
  return (
    <svg viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <circle cx="7.5" cy="10.5" r="5"   strokeWidth="1.3" />
      <path   d="M5 8 Q7 6.5 9 8"         strokeWidth="1"   opacity="0.55" />
      <circle cx="13"  cy="5.5"  r="3"   strokeWidth="1.1" />
      <path   d="M11.5 4 Q13 3 14.5 4"   strokeWidth="0.9" opacity="0.5" />
    </svg>
  )
}

// Ember Glow — coal bed with rising sparks
export function EmberIcon(p: SVGProps) {
  return (
    <svg viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeLinecap="round" {...p}>
      <circle cx="4"   cy="15"   r="1.4" fill="currentColor" stroke="none" />
      <circle cx="8"   cy="14.5" r="1.7" fill="currentColor" stroke="none" />
      <circle cx="12"  cy="15"   r="1.3" fill="currentColor" stroke="none" />
      <circle cx="15"  cy="14"   r="1"   fill="currentColor" stroke="none" opacity="0.7" />
      <circle cx="6.5" cy="10"   r="0.8" fill="currentColor" stroke="none" opacity="0.65" />
      <circle cx="10"  cy="7"    r="0.65" fill="currentColor" stroke="none" opacity="0.5" />
      <circle cx="13"  cy="9.5"  r="0.7" fill="currentColor" stroke="none" opacity="0.55" />
      <circle cx="8.5" cy="4"    r="0.5" fill="currentColor" stroke="none" opacity="0.32" />
    </svg>
  )
}

// Home — simple house outline
export function HomeNavIcon(p: SVGProps) {
  return (
    <svg viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <path d="M2.5 8.5 L9 2.5 L15.5 8.5" strokeWidth="1.4" />
      <path d="M4.5 7 V15 H7.5 V11 H10.5 V15 H13.5 V7" strokeWidth="1.4" />
    </svg>
  )
}
