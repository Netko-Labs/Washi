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
