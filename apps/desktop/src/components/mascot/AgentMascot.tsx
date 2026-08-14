import type { ReactNode } from 'react'

export type AgentMascotState =
  | 'idle'
  | 'reading'
  | 'thinking'
  | 'writing'
  | 'suggesting'
  | 'done'
  | 'flagged'
  | 'resting'

const INK = '#6B3A1F'
const BG = '#DF8552'

/** The peeking-from-bottom body used by the app icon and vault tiles (1024 rig). */
function Body({ children, eyes }: { children?: ReactNode; eyes?: ReactNode }) {
  return (
    <>
      <path
        d="M150 1100 L150 620 C150 520 200 480 300 472 C380 466 430 452 512 452 C580 452 650 456 700 462 L874 620 L874 1100 Z"
        fill="#FFF6E4"
        stroke="#FFF6E4"
        strokeWidth="72"
        strokeLinejoin="round"
      />
      <path
        d="M150 1100 L150 620 C150 520 200 480 300 472 C380 466 430 452 512 452 C580 452 650 456 700 462 L874 620 L874 1100 Z"
        fill="#F7EDD6"
        stroke={INK}
        strokeWidth="18"
        strokeLinejoin="round"
      />
      <path
        d="M700 462 L874 620 L706 606 Q690 530 700 462 Z"
        fill="#AEBB9A"
        stroke={INK}
        strokeWidth="18"
        strokeLinejoin="round"
      />
      <ellipse cx="266" cy="750" rx="48" ry="30" fill="#F0A487" opacity="0.9" />
      <ellipse cx="758" cy="750" rx="48" ry="30" fill="#F0A487" opacity="0.9" />
      {eyes}
      {children}
      <rect
        x="286"
        y="952"
        width="140"
        height="130"
        rx="60"
        fill="#F7EDD6"
        stroke={INK}
        strokeWidth="18"
      />
      <rect
        x="598"
        y="952"
        width="140"
        height="130"
        rx="60"
        fill="#F7EDD6"
        stroke={INK}
        strokeWidth="18"
      />
    </>
  )
}

function RoundEyes({ up = false, blink = false }: { up?: boolean; blink?: boolean }) {
  const hx = up ? -20 : 18
  const hy = up ? -26 : -18
  return (
    <g
      style={
        blink
          ? {
              animation: 'wblink 4.4s infinite',
              transformBox: 'fill-box',
              transformOrigin: 'center',
            }
          : undefined
      }
    >
      <circle cx="372" cy="672" r="54" fill="#2A1B12" />
      <circle cx="652" cy="672" r="54" fill="#2A1B12" />
      <circle cx={372 + hx} cy={672 + hy} r="19" fill="#fff" />
      <circle cx={652 + hx} cy={672 + hy} r="19" fill="#fff" />
    </g>
  )
}

function HappyShut() {
  return (
    <>
      <path
        d="M320 678 Q372 636 424 678"
        fill="none"
        stroke="#2A1B12"
        strokeWidth="24"
        strokeLinecap="round"
      />
      <path
        d="M600 678 Q652 636 704 678"
        fill="none"
        stroke="#2A1B12"
        strokeWidth="24"
        strokeLinecap="round"
      />
    </>
  )
}

function OpenSmile() {
  return (
    <>
      <path d="M458 742 Q512 730 566 742 Q556 812 512 816 Q468 812 458 742 Z" fill="#7A3A22" />
      <ellipse cx="512" cy="798" rx="34" ry="18" fill="#E8836B" />
    </>
  )
}

// biome-ignore format: state table reads better dense
function stateContent(state: AgentMascotState): { wrap?: string; inner: ReactNode; backdrop?: ReactNode } {
  switch (state) {
    case 'idle': return {
      wrap: 'wbob 3.6s ease-in-out infinite',
      inner: <Body eyes={<RoundEyes blink />}><path d="M460 764 Q512 800 564 764" fill="none" stroke="#7A3A22" strokeWidth="22" strokeLinecap="round" /></Body>,
    }
    case 'reading': return {
      inner: (
        <Body eyes={<g style={{ animation: 'wscan 3.2s ease-in-out infinite', transformBox: 'fill-box', transformOrigin: 'center' }}>
          <circle cx="372" cy="672" r="54" fill="#2A1B12" /><circle cx="652" cy="672" r="54" fill="#2A1B12" />
          <circle cx="390" cy="654" r="19" fill="#fff" /><circle cx="670" cy="654" r="19" fill="#fff" />
        </g>}>
          <path d="M474 776 Q512 794 550 776" fill="none" stroke="#7A3A22" strokeWidth="20" strokeLinecap="round" />
          <path d="M352 938 Q432 902 512 938 Q592 902 672 938 L672 1070 Q592 1034 512 1070 Q432 1034 352 1070 Z" fill="#FDF8EC" stroke={INK} strokeWidth="16" strokeLinejoin="round" />
          <path d="M512 938 V1070" stroke={INK} strokeWidth="12" />
        </Body>
      ),
    }
    case 'thinking': return {
      backdrop: (
        <>
          <circle cx="330" cy="330" r="22" fill="#FFF6E4" style={{ animation: 'wdot 1.8s infinite', transformBox: 'fill-box', transformOrigin: 'center' }} />
          <circle cx="416" cy="270" r="28" fill="#FFF6E4" style={{ animation: 'wdot 1.8s infinite .3s', transformBox: 'fill-box', transformOrigin: 'center' }} />
          <circle cx="520" cy="230" r="34" fill="#FFF6E4" style={{ animation: 'wdot 1.8s infinite .6s', transformBox: 'fill-box', transformOrigin: 'center' }} />
        </>
      ),
      inner: <Body eyes={<RoundEyes up />}><ellipse cx="512" cy="784" rx="22" ry="16" fill="#7A3A22" /></Body>,
    }
    case 'writing': return {
      inner: (
        <Body eyes={<RoundEyes blink />}>
          <path d="M482 780 H542" stroke="#7A3A22" strokeWidth="20" strokeLinecap="round" />
          <g style={{ animation: 'wscrib .4s ease-in-out infinite', transformBox: 'fill-box', transformOrigin: '50% 90%' }}>
            <g transform="translate(668,1000) rotate(-32)">
              <rect x="-18" y="-160" width="36" height="160" rx="8" fill="#E8A23F" stroke={INK} strokeWidth="12" />
              <path d="M-18 -160 L0 -204 L18 -160 Z" fill="#F4DDB8" stroke={INK} strokeWidth="12" strokeLinejoin="round" />
            </g>
          </g>
          <path d="M370 1052 Q420 1032 470 1052 Q520 1072 570 1052" fill="none" stroke={INK} strokeWidth="12" strokeLinecap="round" opacity="0.5" />
        </Body>
      ),
    }
    case 'suggesting': return {
      wrap: 'wwob 2.2s ease-in-out infinite',
      backdrop: (
        <>
          <path d="M810 146 Q820 180 854 190 Q820 200 810 234 Q800 200 766 190 Q800 180 810 146 Z" fill="#F7DC8A" style={{ animation: 'wpop 2.4s infinite', transformBox: 'fill-box', transformOrigin: 'center' }} />
          <path d="M240 174 Q246 194 266 200 Q246 206 240 226 Q234 206 214 200 Q234 194 240 174 Z" fill="#FFF6E4" style={{ animation: 'wpop 2.4s infinite .8s', transformBox: 'fill-box', transformOrigin: 'center' }} />
        </>
      ),
      inner: <Body eyes={<RoundEyes />}><OpenSmile /></Body>,
    }
    case 'done': return {
      wrap: 'wbounce 1.6s ease-in-out infinite',
      backdrop: (
        <>
          <path d="M810 200 Q818 228 846 236 Q818 244 810 272 Q802 244 774 236 Q802 228 810 200 Z" fill="#F7DC8A" style={{ animation: 'wpop 1.8s infinite', transformBox: 'fill-box', transformOrigin: 'center' }} />
          <path d="M230 260 Q236 280 256 286 Q236 292 230 312 Q224 292 204 286 Q224 280 230 260 Z" fill="#FFF6E4" style={{ animation: 'wpop 1.8s infinite .6s', transformBox: 'fill-box', transformOrigin: 'center' }} />
        </>
      ),
      inner: <Body><HappyShut /><OpenSmile /></Body>,
    }
    case 'flagged': return {
      wrap: 'wwob .9s ease-in-out infinite',
      backdrop: (
        <g style={{ animation: 'wfloat 1.6s ease-in-out infinite', transformBox: 'fill-box', transformOrigin: 'center' }}>
          <path d="M512 170 L588 300 L436 300 Z" fill="#F7DC8A" stroke={INK} strokeWidth="14" strokeLinejoin="round" />
          <circle cx="512" cy="256" r="10" fill={INK} />
          <rect x="504" y="204" width="16" height="34" rx="8" fill={INK} />
        </g>
      ),
      inner: (
        <Body eyes={
          <>
            <circle cx="372" cy="672" r="46" fill="#2A1B12" /><circle cx="652" cy="672" r="46" fill="#2A1B12" />
            <circle cx="386" cy="658" r="15" fill="#fff" /><circle cx="666" cy="658" r="15" fill="#fff" />
            <path d="M300 596 L420 620 M724 596 L604 620" stroke="#2A1B12" strokeWidth="20" strokeLinecap="round" />
          </>
        }>
          <path d="M470 796 Q512 772 554 796" fill="none" stroke="#7A3A22" strokeWidth="20" strokeLinecap="round" />
        </Body>
      ),
    }
    case 'resting': return {
      wrap: 'wfloat 5s ease-in-out infinite',
      backdrop: (
        <>
          <circle cx="740" cy="380" r="16" fill="#FFF6E4" style={{ animation: 'wbub 3.4s infinite', transformBox: 'fill-box', transformOrigin: 'center' }} />
          <circle cx="790" cy="330" r="24" fill="#FFF6E4" style={{ animation: 'wbub 3.4s infinite 1.1s', transformBox: 'fill-box', transformOrigin: 'center' }} />
          <circle cx="850" cy="270" r="32" fill="#FFF6E4" style={{ animation: 'wbub 3.4s infinite 2.2s', transformBox: 'fill-box', transformOrigin: 'center' }} />
        </>
      ),
      inner: (
        <Body eyes={
          <>
            <path d="M320 666 Q372 706 424 666" fill="none" stroke="#2A1B12" strokeWidth="24" strokeLinecap="round" />
            <path d="M600 666 Q652 706 704 666" fill="none" stroke="#2A1B12" strokeWidth="24" strokeLinecap="round" />
          </>
        }>
          <circle cx="512" cy="786" r="18" fill="#7A3A22" />
        </Body>
      ),
    }
  }
}

/** Agent status mascot (22px chip → full card). One SVG per state, pure CSS motion. */
export function AgentMascot({
  state,
  size = 22,
  className,
}: {
  state: AgentMascotState
  size?: number
  className?: string
}) {
  const { wrap, inner, backdrop } = stateContent(state)
  return (
    <svg
      viewBox="0 0 1024 1024"
      width={size}
      height={size}
      className={`mascot-motion ${className ?? ''}`}
      style={{ display: 'block', borderRadius: size <= 32 ? 6 : 12 }}
      aria-hidden
    >
      <clipPath id={`am-${state}`}>
        <rect x="12" y="12" width="1000" height="1000" rx="220" />
      </clipPath>
      <g clipPath={`url(#am-${state})`}>
        <rect x="12" y="12" width="1000" height="1000" fill={BG} />
        {backdrop}
        <g style={{ animation: wrap, transformBox: 'fill-box', transformOrigin: 'center' }}>
          {inner}
        </g>
      </g>
    </svg>
  )
}
