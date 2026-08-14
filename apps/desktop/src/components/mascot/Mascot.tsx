export type MascotFace = 'happy' | 'sleep' | 'curious' | 'sad' | 'dizzy' | 'wink' | 'blank'
export type MascotMotion = 'none' | 'flip' | 'bob' | 'peek' | 'breathe' | 'sway'

const FACE_IDS: Record<MascotFace, string> = {
  happy: '#fHappy',
  sleep: '#fSleep',
  curious: '#fCurious',
  sad: '#fSad',
  dizzy: '#fDizzy',
  wink: '#fWink',
  blank: '#fBlank',
}

const MOTION_STYLES: Record<MascotMotion, string | undefined> = {
  none: undefined,
  flip: 'wFlip 1.1s linear infinite',
  bob: 'wBob 2.4s ease-in-out infinite',
  peek: 'wPeek 2.6s ease-in-out infinite',
  breathe: 'wBreathe 2.6s ease-in-out infinite',
  sway: 'wSway 3.2s ease-in-out infinite',
}

/** The small washi-chan rig (240×266). Requires <MascotDefs/> mounted at root. */
export function Mascot({
  face = 'happy',
  motion = 'none',
  size = 32,
  className,
  opacity,
}: {
  face?: MascotFace
  motion?: MascotMotion
  size?: number
  className?: string
  opacity?: number
}) {
  return (
    <svg
      viewBox="0 0 240 266"
      width={size}
      className={className}
      style={{ display: 'block', overflow: 'visible', opacity }}
      aria-hidden
    >
      <g
        style={{
          animation: MOTION_STYLES[motion],
          transformBox: 'fill-box',
          transformOrigin: 'center',
        }}
      >
        <use href="#wBody" />
        <use href={FACE_IDS[face]} />
      </g>
    </svg>
  )
}
