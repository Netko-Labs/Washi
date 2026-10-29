import type { api } from '@/lib/rpc'
import type { SETTINGS_TABS } from './values'

export type InferenceWire = Awaited<ReturnType<typeof api.agents.inference.query>>
export type SpendWire = Awaited<ReturnType<typeof api.agents.spend.query>>
export type InferencePreference = InferenceWire['preference']
export type LocalModel = NonNullable<InferenceWire['localModel']>
export type RoutineWire = Awaited<ReturnType<typeof api.routines.list.query>>[number]

export interface RoutineDraft {
  title: string
  prompt: string
  /** HH:MM on this computer's clock. */
  time: string
}

export type ApprovalMode = 'ask' | 'auto'

export type SettingsTab = (typeof SETTINGS_TABS)[number]['key']

export interface InUseProps {
  on: boolean
}

export interface DailyStopInputProps {
  capUsd: number
  onSave: (capUsd: number) => void
}
