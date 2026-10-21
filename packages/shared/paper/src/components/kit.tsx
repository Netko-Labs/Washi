import { styled } from '../lib'
import type { BlockProps, Size } from '../lib/types'

const MASCOT_FACES: Record<string, string> = {
  happy: '#fHappy',
  sleep: '#fSleep',
  curious: '#fCurious',
  sad: '#fSad',
  dizzy: '#fDizzy',
  wink: '#fWink',
}
const MASCOT_SIZES: Record<Size, number> = { sm: 40, md: 72, lg: 120 }

export function Chip({ children, ...rest }: BlockProps) {
  return <span {...styled(rest, 'wsx-chip')}>{children}</span>
}

/** Washi-chan. Geometry lives in the host's <MascotDefs/> symbols (#wBody, #f*). */
export function Mascot({
  mood = 'happy',
  size = 'md',
  ...rest
}: BlockProps & { mood?: string; size?: Size }) {
  const px = MASCOT_SIZES[size]
  return (
    <svg
      {...styled(rest, 'wsx-mascot')}
      viewBox="0 0 240 266"
      width={px}
      height={(px * 266) / 240}
      aria-hidden
    >
      <use href="#wBody" />
      <use href={MASCOT_FACES[mood] ?? MASCOT_FACES.happy} />
    </svg>
  )
}

/** A capability the registry lacks: labelled, valid, and a request on record. */
export function Missing({ kind, reason }: { kind: string; reason: string }) {
  return (
    <div className="wsx-missing" role="note">
      <b>{kind}</b> is not in the registry yet — {reason}
    </div>
  )
}
