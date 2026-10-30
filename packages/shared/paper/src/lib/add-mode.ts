import type { PaperHost } from '../provider'
import type { AddMode } from './types'

/** A link that takes suggestions suggests; any other read-only host draws no way to add. */
export function addModeOf(host: PaperHost): AddMode {
  if (host.suggestRow) return 'suggest'
  return host.isReadOnly ? null : 'write'
}
