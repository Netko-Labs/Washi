import { READ_FRESH_MS } from './constants'
import { createReads } from './utils'

/** Tables, members and queries every view on screen asks for; forgotten when data moves. */
export const dataReads = createReads(READ_FRESH_MS)

/** Compiled page code; forgotten when any page moves, since a bundle reads the pages it imports. */
export const pageReads = createReads(READ_FRESH_MS)

/** A new workspace: nothing the last one answered holds here. */
export function forgetReads(): void {
  dataReads.forget()
  pageReads.forget()
}
