import { Mascot, VaultIcon } from '@washi/ui'
import type { HeroSyncProps, SpeckProps, ToggleProps } from './types'

const GOLD = '#E8B36A'
const INK = '#6B3A1F'

export function Toggle({ on, onClick }: ToggleProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      onClick={onClick}
      className={`relative h-5 w-9 shrink-0 rounded-full transition-colors ${on ? 'bg-primary' : 'bg-border'}`}
    >
      <span
        className={`absolute top-0.5 size-4 rounded-full bg-background transition-all ${on ? 'left-[18px]' : 'left-0.5'}`}
      />
    </button>
  )
}

function Sparkle({ className, size = 22, delay = 0 }: SpeckProps) {
  return (
    <svg viewBox="0 0 56 56" width={size} className={`absolute ${className}`} aria-hidden>
      <path
        d="M28 0 Q34 22 56 28 Q34 34 28 56 Q22 34 0 28 Q22 22 28 0 Z"
        fill={GOLD}
        style={{
          animation: `wSparkle 2.8s ease-in-out ${delay}s infinite`,
          transformBox: 'fill-box',
          transformOrigin: 'center',
        }}
      />
    </svg>
  )
}

function Dot({ className, size = 10, delay = 0 }: SpeckProps) {
  return (
    <span
      className={`absolute rounded-full bg-[#E8B36A] ${className}`}
      style={{
        width: size,
        height: size,
        animation: `wSparkle 2.8s ease-in-out ${delay}s infinite`,
      }}
    />
  )
}

function Sheet({ className, delay = 0 }: SpeckProps) {
  return (
    <svg
      viewBox="0 0 50 66"
      width={24}
      className={`absolute ${className}`}
      style={{ animation: `wFly 2.4s ease-in ${delay}s infinite` }}
      aria-hidden
    >
      <path
        d="M4 4 H30 L46 20 V52 C46 58 42 62 36 62 H12 C7 62 4 58 4 54 Z"
        fill="#FFFDF6"
        stroke={INK}
        strokeWidth="6"
        strokeLinejoin="round"
      />
      <path
        d="M30 4 L46 20 H34 C31 20 30 18 30 15 Z"
        fill="#AEBB9A"
        stroke={INK}
        strokeWidth="6"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function ServerArt() {
  return (
    <svg viewBox="-8 -8 136 166" width={64} className="shrink-0" aria-hidden>
      <rect
        x="0"
        y="0"
        width="120"
        height="150"
        rx="16"
        fill="#E7DCC8"
        stroke={INK}
        strokeWidth="8"
      />
      <rect x="18" y="22" width="84" height="14" rx="7" fill="#C9B896" />
      <rect x="18" y="48" width="84" height="14" rx="7" fill="#C9B896" />
      <rect x="18" y="74" width="58" height="14" rx="7" fill="#C9B896" />
      <circle cx="96" cy="118" r="9" fill="#AEBB9A" className="animate-pulse" />
    </svg>
  )
}

export function HeroWelcome() {
  return (
    <div className="relative h-[168px] w-[196px]">
      <Sparkle className="top-[44px] -left-7" size={22} delay={0} />
      <Sparkle className="top-0 right-0" size={13} delay={0.9} />
      <Dot className="top-[86px] right-2" size={11} delay={1.7} />
      <Dot className="top-[118px] -left-4" size={9} delay={2.2} />
      <Mascot face="happy" motion="bob" size={150} className="absolute bottom-0 left-3" />
    </div>
  )
}

export function HeroVaults() {
  const pop = (delay: number) => ({ animation: `wPop 5s ease ${delay}s infinite` })
  return (
    <div className="relative h-[172px] w-[252px]">
      <span className="absolute top-[30px] left-0" style={pop(0)}>
        <VaultIcon topic="journal" size={44} />
      </span>
      <span className="absolute top-0 left-[106px]" style={pop(0.5)}>
        <VaultIcon topic="ideas" size={44} />
      </span>
      <span className="absolute top-[38px] right-0" style={pop(1)}>
        <VaultIcon topic="work" size={44} />
      </span>
      <Mascot face="curious" size={134} className="absolute bottom-0 left-[56px]" />
    </div>
  )
}

export function HeroSync({ server }: HeroSyncProps) {
  if (server) {
    return (
      <div className="relative flex h-[158px] w-[300px] items-end gap-10">
        <Mascot face="happy" motion="breathe" size={138} />
        <Sheet className="top-3 left-[142px]" delay={0} />
        <Sheet className="top-[70px] left-[176px]" delay={1.2} />
        <ServerArt />
      </div>
    )
  }
  return (
    <div className="relative h-[158px] w-[220px]">
      <Sheet className="top-1 right-10" delay={0} />
      <Sheet className="top-[62px] right-0" delay={0.8} />
      <Sheet className="top-[112px] right-7" delay={1.6} />
      <Mascot face="happy" motion="breathe" size={138} className="absolute bottom-0 left-0" />
    </div>
  )
}

export function HeroDone() {
  const fall = (delay: number) => ({ animation: `wFall 3s linear ${delay}s infinite` })
  return (
    <div className="relative h-[168px] w-[204px]">
      <span
        className="absolute top-0 left-0 h-[18px] w-3 rounded-[3px] bg-[#D4713F]"
        style={fall(0)}
      />
      <span
        className="absolute top-0 left-[52px] h-4 w-2.5 rounded-[3px] bg-[#AEBB9A]"
        style={fall(0.6)}
      />
      <span
        className="absolute top-0 left-[100px] size-3.5 rounded-full bg-[#E8B36A]"
        style={fall(1.1)}
      />
      <span
        className="absolute top-0 left-[152px] h-[18px] w-3 rounded-[3px] bg-[#9FB6C4]"
        style={fall(1.6)}
      />
      <span
        className="absolute top-0 left-[188px] size-3 rounded-full bg-[#D4713F]"
        style={fall(2.1)}
      />
      <span
        className="absolute top-0 left-[78px] h-3.5 w-2 rounded-[3px] bg-[#F0A487]"
        style={fall(2.5)}
      />
      <Mascot face="wink" motion="bob" size={140} className="absolute bottom-0 left-7" />
    </div>
  )
}
