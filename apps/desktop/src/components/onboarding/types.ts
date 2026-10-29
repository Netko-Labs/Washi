import type { ComponentType, ReactNode } from 'react'

export type SyncChoice = 'offline' | 'server'

export interface OnboardingDraft {
  step: number
  user: string
  email: string
  color: string
  name: string
  vault: string
  sync: SyncChoice
  server: string
  e2e: boolean
  agent: boolean
  nudge: boolean
}

export type PatchDraft = (patch: Partial<OnboardingDraft>) => void

export interface StepProps {
  draft: OnboardingDraft
  patch: PatchDraft
}

export interface ToggleProps {
  on: boolean
  onClick: () => void
}

export interface HeroSyncProps {
  server: boolean
}

export interface SpeckProps {
  className?: string
  size?: number
  delay?: number
}

export interface ChoiceCardProps {
  selected: boolean
  onClick: () => void
  icon: ComponentType<{ className?: string }>
  title: string
  desc: string
}

export interface ConsentCardProps {
  art: ReactNode
  title: string
  desc: string
  on: boolean
  onToggle: () => void
}
