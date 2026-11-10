export interface WorkspaceLookState {
  /** What a page with no icon of its own wears (D139); null draws a page glyph. */
  icon: string | null
  /** What a page with no cover of its own wears; null draws none. */
  cover: string | null
  refresh: () => Promise<void>
  reset: () => void
}
