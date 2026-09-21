export interface KeyState {
  last4: string
  provider: string
  model: string | null
  updatedAt: string
}

export interface SpendState {
  day: string
  costUsd: number
  turns: number
  capUsd: number
  paused: boolean
}
