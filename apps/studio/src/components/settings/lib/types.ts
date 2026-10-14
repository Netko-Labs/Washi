import type { ReactNode } from 'react'
import type { ModelOption } from '@/lib/types'

export interface KeyState {
  last4: string
  provider: string
  model: string | null
  updatedAt: string
}

export interface SpendState {
  day: string
  costUsd: number
  savedUsd: number
  turns: number
  capUsd: number
  turnCap: number
  paused: boolean
}

export interface KeyInput {
  key: string
  provider: string
  model: string | null
}

export interface KeyFormProps {
  models: ModelOption[]
  catalogueSource: string | null
  hasKey: boolean
  onSave: (input: KeyInput) => Promise<boolean>
  /** Fields that save with the key, rendered above its button. */
  extra?: ReactNode
}

export interface DailyStopProps {
  capUsd: number
  onSave: (capUsd: number) => Promise<unknown>
}

export interface SettingsScreenProps {
  workspaceId: string
}

export type SettingsTab = 'agent' | 'people' | 'routines'
