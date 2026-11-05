import type { SheetAuthor } from '@washi/domain'

/** One replacement in a page's source: `old` must occur exactly once where it is applied. */
export interface SheetEdit {
  old: string
  new: string
}

export interface SheetEditOptions {
  editedBy?: SheetAuthor
  /** The version the edits were written against; without it they apply to the page as it is. */
  baseVersion?: string
  /** A new title; without it the page keeps its own. */
  title?: string
}

/** A page a link opens beside its own (D123): what a Subpages card or a Ref needs, and where it sits. */
export interface SharedTreePage {
  id: string
  parentId: string
  title: string
  icon: string | null
  cover: string | null
}
