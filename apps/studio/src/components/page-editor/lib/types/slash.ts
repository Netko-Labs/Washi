import type { UploadKind } from '@washi/domain'
import type { KeyboardEvent, RefObject } from 'react'
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
  | { kind: 'columns'; count: 2 | 3 }
  | { kind: 'include'; sheet: string }
  | { kind: 'outline' }
  | { kind: 'backlinks' }

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

/** The `/` menu's headings, in the order they are drawn. */
export type SlashGroup = 'basic' | 'media' | 'database' | 'layout' | 'advanced' | 'code'

/** A second step of the menu: a list of tables or pages to drop the block over. */
export type SlashStep = 'view' | 'progress' | 'automation' | 'link' | 'include'

export type DataOption = {
  type: 'data'
  group: SlashGroup
  key: string
  label: string
  hint: string
  pick: DataPick
}

export type StepOption = {
  type: 'step'
  group: SlashGroup
  key: string
  label: string
  hint: string
  step: SlashStep
}

export type SlashOption =
  | ({ type: 'text'; group: SlashGroup } & KindOption)
  | DataOption
  | StepOption

/** A block `/` offers as it is: `words` are what else finds it; `isTopLevel` keeps it off columns. */
export type SlashEntry = (DataOption | StepOption) & { words: string; isTopLevel?: boolean }

export interface SlashStepCopy {
  label: string
  hint: string
  words: string
  group: SlashGroup
  empty: string
}

/** What the menu is offered from; `selfId` is the page being typed into, never included in itself. */
export interface SlashSources {
  tables?: TableRef[]
  pages?: PageRef[]
  isNested?: boolean
  step?: SlashStep | null
  selfId?: string | null
}

/** Where the arrows are: the step open and the row lit, for the query they were moved on. */
export interface SlashNav {
  step: SlashStep | null
  active: number
  query: string
}

export interface SlashMenuState {
  query: string | null
  step: SlashStep | null
  options: SlashOption[]
  active: number
  pick: (option: SlashOption) => void
  back: () => void
  hover: (index: number) => void
  /** True when the menu took the key. */
  onKeyDown: (event: KeyboardEvent<HTMLTextAreaElement>) => boolean
  onText: (value: string) => void
}

export interface SlashMenuProps {
  anchor: RefObject<HTMLElement | null>
  menu: SlashMenuState
}
