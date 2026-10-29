import type { ReactNode } from 'react'
import type { VAULT_TOPICS } from './vault-topics'

export type AgentMascotState =
  | 'idle'
  | 'reading'
  | 'thinking'
  | 'writing'
  | 'suggesting'
  | 'done'
  | 'flagged'
  | 'resting'

export type MascotFace = 'happy' | 'sleep' | 'curious' | 'sad' | 'dizzy' | 'wink' | 'blank'
export type MascotMotion = 'none' | 'flip' | 'bob' | 'peek' | 'breathe' | 'sway'

export interface MascotBodyProps {
  children?: ReactNode
  eyes?: ReactNode
}

export interface RoundEyesProps {
  up?: boolean
  blink?: boolean
}

export interface MascotStateContent {
  wrap?: string
  inner: ReactNode
  backdrop?: ReactNode
}

export interface AgentMascotProps {
  state: AgentMascotState
  size?: number
  className?: string
  crop?: boolean
}

export interface MascotProps {
  face?: MascotFace
  motion?: MascotMotion
  size?: number
  className?: string
  opacity?: number
}

export interface VaultIconProps {
  topic: string
  size?: number
  className?: string
}

export interface VaultTopic {
  bg: string
  ear?: string
  backdrop?: ReactNode
  face?: ReactNode
  extra?: ReactNode
}

export type VaultTopicName = keyof typeof VAULT_TOPICS
