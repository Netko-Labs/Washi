import { openSandbox } from '../../../lib/sandbox'
import type { Sandbox } from '../../../lib/types'
import { MEMORY_BYTES, prelude, RUN_DEADLINE_MS } from './values'

const BRIDGE = ['state', 'set', 'rows', 'interval', 'act']

/** A `<Script>`'s sandbox: the shared one, with the hooks a Script has always had. */
export function openScriptSandbox(js: string, names: string[]): Promise<Sandbox> {
  return openSandbox(js, {
    prelude: prelude(names),
    names: BRIDGE,
    deadlineMs: RUN_DEADLINE_MS,
    memoryBytes: MEMORY_BYTES,
  })
}
