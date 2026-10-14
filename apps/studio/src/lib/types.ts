export interface WorkspaceSummary {
  id: string
  name: string
  role: string
}

export interface ModelOption {
  provider: string
  providerName: string
  id: string
  name: string
  contextTokens: number | null
  inputPerMTok: number | null
  outputPerMTok: number | null
  reasoning: boolean
}
