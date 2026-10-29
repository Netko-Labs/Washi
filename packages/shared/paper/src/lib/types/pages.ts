import type { WsxElement } from '@washi/wsx'
import type { ReactNode } from 'react'
import type { BlockProps } from './style'

/** What a link to a page shows: its title and look, never its content. */
export interface PageCard {
  id: string
  title: string
  icon: string | null
  cover: string | null
}

export type SubpagesLayout = 'list' | 'cards' | 'gallery'

export interface PageLinkProps extends BlockProps {
  sheet: string
}

export interface SubpagesProps extends BlockProps {
  of?: string
  layout?: SubpagesLayout
  empty?: string
}

export interface PageGlyphProps {
  icon: string | null
}

export interface PageEntryProps {
  page: PageCard
  layout: SubpagesLayout
  onOpen: () => void
}

export interface IncludeProps extends BlockProps {
  sheet: string
  /** Draws the included page's body; WsxView lends it, so paper's modules never loop. */
  render?: (root: WsxElement) => ReactNode
}

export type IncludeState =
  | { status: 'loading' }
  | { status: 'gone' }
  | { status: 'ready'; title: string; root: WsxElement }

export interface BacklinksProps extends BlockProps {
  of?: string
  empty?: string
}

export interface OutlineProps extends BlockProps {
  title?: string
}

export interface OutlineEntry {
  level: number
  text: string
  target: HTMLElement
}
