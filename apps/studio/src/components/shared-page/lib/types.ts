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
  /** Its adds become suggestions a member approves (D120). */
  suggest: boolean
  /** Whether those ask the visitor's email as well as their name (D131). */
  askEmail: boolean
  /** The link's own page; the page drawn is this one or one of `pages`. */
  home: { id: string; title: string; icon: string | null }
  /** The sub-pages the link opens beside its own, in tree order (D123); empty when it opens none. */
  pages: SharedTreePage[]
}

/** A page the link opens: what a Subpages card or a Ref draws, and its parent. */
export interface SharedTreePage {
  id: string
  parentId: string
  title: string
  icon: string | null
  cover: string | null
}

export interface ShareHostOptions {
  embedsAnySite: boolean
  suggest: boolean
  askEmail: boolean
  /** The sub-page drawn, when it is not the link's own page. */
  page?: string
  home: SharedPayload['home'] | null
  pages: SharedTreePage[]
  /** Opens one of the link's pages in place; `undefined` is its own. */
  open: (page: string | undefined) => void
}

export type SharedState =
  | { status: 'loading' }
  | { status: 'gone' }
  | { status: 'ready'; page: SharedPayload; root: WsxElement }

export interface SharedPageProps {
  workspaceId: string
  token: string
  /** One of the link's sub-pages (D123); none is the link's own page. */
  page?: string
}

export interface SharedTrailProps {
  page: SharedPayload
  onOpen: (page: string | undefined) => void
}
