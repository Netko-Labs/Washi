/** Who suggests through a link (D120): shown with the suggestion, never written into the table. */
export interface Visitor {
  name: string
  email: string
  /** A field no person sees; a bot fills it. */
  trap?: string
}

/** How a page's add lands: written, suggested to a member, or not drawn at all (a read-only link). */
export type AddMode = 'write' | 'suggest' | null
