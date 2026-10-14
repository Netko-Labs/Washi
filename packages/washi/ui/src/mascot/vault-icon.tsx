import { OPEN_SMILE, SPARKLE_EYES, VAULT_TOPICS, type VaultTopic } from './lib/vault-topics'

const INK = '#6B3A1F'
const PAPER = '#F7EDD6'

/** Vault tile mascot (1024 rig, squircle rx=220). Unknown topics get the plain look. */
export function VaultIcon({
  topic,
  size = 40,
  className,
}: {
  topic: string
  size?: number
  className?: string
}) {
  const def: VaultTopic = VAULT_TOPICS[topic.toLowerCase()] ?? {
    bg: '#DF8552',
    face: (
      <>
        {SPARKLE_EYES}
        {OPEN_SMILE}
      </>
    ),
  }
  const ear = def.ear ?? '#AEBB9A'
  const clipId = `vault-${topic.replace(/[^a-z0-9]/gi, '')}`

  return (
    <svg
      viewBox="0 0 1024 1024"
      width={size}
      height={size}
      className={className}
      style={{ display: 'block' }}
      aria-hidden
    >
      <clipPath id={clipId}>
        <rect x="12" y="12" width="1000" height="1000" rx="220" />
      </clipPath>
      <g clipPath={`url(#${clipId})`}>
        <rect x="12" y="12" width="1000" height="1000" fill={def.bg} />
        {def.backdrop}
        {def.extra && topic.toLowerCase() === 'study' ? def.extra : null}
        <path
          d="M150 1100 L150 620 C150 520 200 480 300 472 C380 466 430 452 512 452 C580 452 650 456 700 462 L874 620 L874 1100 Z"
          fill="#FFF6E4"
          stroke="#FFF6E4"
          strokeWidth="72"
          strokeLinejoin="round"
        />
        <path
          d="M150 1100 L150 620 C150 520 200 480 300 472 C380 466 430 452 512 452 C580 452 650 456 700 462 L874 620 L874 1100 Z"
          fill={PAPER}
          stroke={INK}
          strokeWidth="18"
          strokeLinejoin="round"
        />
        <path
          d="M700 462 L874 620 L706 606 Q690 530 700 462 Z"
          fill={ear}
          stroke={INK}
          strokeWidth="18"
          strokeLinejoin="round"
        />
        <ellipse cx="266" cy="750" rx="48" ry="30" fill="#F0A487" opacity="0.9" />
        <ellipse cx="758" cy="750" rx="48" ry="30" fill="#F0A487" opacity="0.9" />
        {def.face}
        <rect
          x="286"
          y="952"
          width="140"
          height="130"
          rx="60"
          fill={PAPER}
          stroke={INK}
          strokeWidth="18"
        />
        <rect
          x="598"
          y="952"
          width="140"
          height="130"
          rx="60"
          fill={PAPER}
          stroke={INK}
          strokeWidth="18"
        />
        {topic.toLowerCase() !== 'study' ? def.extra : null}
      </g>
    </svg>
  )
}
