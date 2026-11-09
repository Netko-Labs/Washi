/** Who suggests through a link (D120): shown with the suggestion, never written into the table. */
export interface Visitor {
  name: string
  email: string
  /** A field no person sees; a bot fills it. */
  trap?: string
}

/** Who asked for a row through a link, kept with it once approved (D131). */
export interface RowGuest {
  name: string
  /** Null where the page asked none, or for a reader the host does not show it to. */
  email: string | null
}

/** How a page's add lands: written, suggested to a member, or not drawn at all (a read-only link). */
export type AddMode = 'write' | 'suggest' | null
