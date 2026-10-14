/** Where a dragged page lands relative to the row it is dropped on. */
export type PageDrop = 'before' | 'after' | 'inside'

export interface PagePlacement {
  parentId: string | null
  index: number
}
