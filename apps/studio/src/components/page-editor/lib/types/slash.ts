import type { UploadKind } from '@washi/domain'
import type { KeptPhoto } from '@/components/shared/unsplash'
import type { KindOption, StarterBlock } from './props'

/** A table the `/` menu can drop live onto the page, and which status counts as shipped. */
export interface TableRef {
  name: string
  done: { column: string; values: string[] } | null
}

export type DataPick =
  | { kind: 'view'; table: string }
  | { kind: 'progress'; table: TableRef }
  | { kind: 'database'; name: string }
  | { kind: 'subpage' }
  | { kind: 'subpages'; layout: 'list' | 'gallery' }
  | { kind: 'link'; sheet: string }
  | { kind: 'embed'; src: string }
  | { kind: 'bookmark'; href: string }
  /** `file` arrives once the person picked one; the menu offers the kind. */
  | { kind: 'upload'; as: UploadKind; file?: File }
  | { kind: 'gallery'; files?: File[] }
  | { kind: 'unsplash'; photo?: KeptPhoto }
  | { kind: 'code' }
  | { kind: 'widget' }
  | { kind: 'terminal' }
  | { kind: 'formula' }
  | { kind: 'starter'; block: StarterBlock }
  | { kind: 'automation'; table: string }
  | { kind: 'tabs' }

/** What `links.preview` read off a site, before it becomes a Bookmark's props. */
export interface BookmarkPreview {
  title: string | null
  description: string | null
  image: string | null
  site: string | null
}

/** An upload once stored: what a block needs to point at it. */
export interface StoredUpload {
  id: string
  name: string
  size: number
}

/** A page the `/` menu can link to. */
export interface PageRef {
  id: string
  title: string
}

export type SlashOption =
  | ({ type: 'text' } & KindOption)
  | { type: 'data'; key: string; label: string; hint: string; pick: DataPick }

export interface SlashMenuProps {
  id: string
  query: string
  onPick: (option: SlashOption) => void
}
