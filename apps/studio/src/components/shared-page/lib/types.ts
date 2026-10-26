import type { WsxElement } from '@washi/wsx'

export interface SharedPayload {
  id: string
  title: string
  icon: string | null
  cover: string | null
  fullWidth: boolean
  hlcUpdated: string
  source: string
}

export type SharedState =
  | { status: 'loading' }
  | { status: 'gone' }
  | { status: 'ready'; page: SharedPayload; root: WsxElement }

export interface SharedPageProps {
  workspaceId: string
  token: string
}
