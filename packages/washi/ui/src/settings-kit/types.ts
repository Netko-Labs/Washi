import type { ReactNode } from 'react'

export interface SettingsCardProps {
  children: ReactNode
}

export interface SettingsRowProps {
  title: string
  sub: string
  mono?: boolean
  wrap?: boolean
  last?: boolean
  children: ReactNode
}

export interface StaticToggleProps {
  on: boolean
}

export interface SegmentedControlProps {
  options: string[]
  active: string
  onSelect?: (option: string) => void
}

export interface RowButtonProps {
  children: ReactNode
  onClick?: () => void
}

export interface DangerButtonProps {
  children: ReactNode
}
