import { InkError } from '../../errors'
import { MAX_IMPORT_ROWS } from '../constants'

/** Refused as soon as a file passes the cap, before the rest of it is read into rows. */
export function refuseOverCap(count: number): void {
  if (count <= MAX_IMPORT_ROWS) return
  throw new InkError(
    `more than ${MAX_IMPORT_ROWS.toLocaleString('en')} rows; one import takes ${MAX_IMPORT_ROWS.toLocaleString('en')} — split the file`,
  )
}
