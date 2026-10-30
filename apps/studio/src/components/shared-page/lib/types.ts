import type { UnsplashCredit } from '@washi/paper'
import type { ThemePair } from '@washi/paper/registry'
import type { WsxElement } from '@washi/wsx'

export interface SharedPayload {
  id: string
  title: string
  icon: string | null
  cover: string | null
  fullWidth: boolean
  hlcUpdated: string
  source: string
  /** The workspace theme the page wears, if any; built-in themes need nothing. */
  theme: ThemePair | null
  /** An Unsplash cover's hotlink and credit (D117); the reader cannot ask for it. */
  unsplash: (UnsplashCredit & { id: string }) | null
  /** The workspace or server lists `*` for embeds: any https one plays (D118). */
  embedsAnySite: boolean
}

export type SharedState =
  | { status: 'loading' }
  | { status: 'gone' }
  | { status: 'ready'; page: SharedPayload; root: WsxElement }

export interface SharedPageProps {
  workspaceId: string
  token: string
}
