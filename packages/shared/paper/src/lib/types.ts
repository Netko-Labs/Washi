import type { Scalar } from '@washi/ink'
import type { WsxElement } from '@washi/wsx'
import type { ReactNode } from 'react'
import type { ThemePair } from '../registry/themes'

export type Variant = 'plain' | 'outline' | 'filled' | 'raised' | 'tape'
export type Tone = 'neutral' | 'accent' | 'info' | 'success' | 'warning' | 'danger'
export type Size = 'sm' | 'md' | 'lg'
export type Emphasis = 'quiet' | 'normal' | 'strong'
export type Gap = 'tight' | 'normal' | 'loose'
export type Feel = 'note' | 'editorial' | 'board' | 'deck'
export type Width = 'page' | 'wide' | 'full'

export interface StyledProps {
  variant?: Variant
  tone?: Tone
  size?: Size
  emphasis?: Emphasis
  span?: number
  width?: Width
  class?: string
}

export interface BlockProps extends StyledProps {
  children?: ReactNode
}

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

export interface BookmarkProps extends BlockProps {
  href: string
  title?: string
  description?: string
  image?: string
  site?: string
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

export interface EmbedProps extends BlockProps {
  src: string
  title?: string
  ratio?: '16:9' | '4:3' | '3:2' | '1:1'
  height?: number
}

/** Asking the workspace's list, refused by it, or playing at the frame's address. */
export type EmbedState =
  | { status: 'asking' }
  | { status: 'blocked' }
  | { status: 'playing'; player: string }

export type TileShape = 'square' | 'wide' | 'tall' | 'big' | 'banner'

export interface ColumnsProps extends BlockProps {
  gap?: Gap
}

export interface ColumnProps extends BlockProps {
  ratio?: number
}

export interface BentoProps extends BlockProps {
  gap?: Gap
  columns?: 3 | 4 | 6
}

export interface TileProps extends BlockProps {
  shape?: TileShape
  title?: string
}

export type Row = Record<string, Scalar>

export type CellKind = 'string' | 'number'

export interface ActionRef {
  verb: string
  [key: string]: unknown
}

export interface BindState {
  rows: Row[]
  status: 'loading' | 'ready' | 'error'
  error: string | null
}

/**
 * Tables that expressions aggregate over, fetched once per sheet and again after
 * every verb — or after anyone else's write. `version` is what bound primitives watch.
 */
export interface DataContextValue {
  tables: Record<string, Row[]>
  version: number
  refresh: () => void
}

export interface PaperSurfaceProps {
  children?: ReactNode
}

export interface SheetLook {
  /** A registry theme id, or `ws:<slug>` the host lends through `SheetLookHost.theme`. */
  theme?: string
  feel?: Feel
  accent?: Tone
  icon?: string
  cover?: string
}

export interface SheetFrameProps extends SheetLook {
  children?: ReactNode
}

export type LookPart = 'icon' | 'cover'

/** What a host lends a page's look: where pictures live, how to draw an icon, how to change one. */
export interface SheetLookHost {
  /** The host's own band under the icon — who is here, the add buttons, a row's properties. */
  band?: ReactNode
  drawIcon?(name: string): ReactNode
  fileUrl?(id: string): string
  pictureUrl?(slug: string): string
  /** A workspace theme's tokens by its `ws:<slug>` key; unknown keys wear Washi. */
  theme?(key: string): ThemePair | undefined
  /** A read-only host leaves it out and the look stays still. */
  edit?(part: LookPart, anchor: HTMLElement): void
}

export interface SheetLookProviderProps {
  value: SheetLookHost
  children?: ReactNode
}

export interface SheetCoverProps {
  cover: string
}

export interface SheetMarkProps {
  icon: string
  overCover: boolean
}

export interface RedactProps extends BlockProps {
  reason?: string
}

/** A `<Select>` choice: the value written to state, shown as itself or a label. */
export type SelectOption = string | { value: string; label: string }

export interface SelectProps extends BlockProps {
  state: string
  label?: string
  options: SelectOption[]
  /** An empty choice that clears the state, so every view filtered on it shows everything. */
  all?: string
}

/** One bar, slice or point of a chart: its label and its number. */
export interface ChartPoint {
  label: string
  value: number
}

export interface ChartBarsProps {
  points: ChartPoint[]
  locale?: string
}
