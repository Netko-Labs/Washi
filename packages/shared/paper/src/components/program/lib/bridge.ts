import { readStored, storedKey, writeStored } from '../../../lib'
import { stateValue } from '../../../lib/sandbox'
import type { ActionRef, ProgramLive, ProgramNeeds, SandboxBridge } from '../../../lib/types'
import type { PaperHost } from '../../../provider'
import { PROGRAM_MIN_INTERVAL_MS } from './values'

/**
 * The host's side of every `__bridge_*` for one run: answers from what is already known, and notes
 * in `needs` what to fetch after the run — rows, a table's columns, the members — to draw again.
 */
export function programBridge(
  live: ProgramLive,
  host: PaperHost,
  needs: ProgramNeeds,
  isPress: boolean,
): SandboxBridge {
  // Writes are a press's alone: refused here whatever the page's code called, and the run stops.
  const pressed =
    (what: string, write: (...args: string[]) => void) =>
    (...args: string[]) => {
      if (isPress) write(...args)
      else needs.refused ??= what
    }
  const cached = (map: Map<string, string | null>, key: string, wanted: string[]) => {
    const known = map.get(key)
    if (known === undefined) wanted.push(key)
    return known ?? undefined
  }
  return {
    rows: (query) => cached(live.rows, query, needs.queries),
    table: (name) => cached(live.tables, name, needs.tables),
    state: (key) => (key in live.values ? JSON.stringify(live.values[key]) : undefined),
    seed: (key = '', json = 'null') => {
      if (!(key in needs.seeds)) needs.seeds[key] = stateValue(json)
    },
    set: pressed('a page state change', (key = '', json = 'null') =>
      live.set(key, stateValue(json)),
    ),
    stored: (key) => readStored(storedKey(host.pageId, key)),
    store: pressed('a stored change', (key = '', json = 'null') =>
      writeStored(storedKey(host.pageId, key), json),
    ),
    interval: (ms) => {
      const asked = Math.max(PROGRAM_MIN_INTERVAL_MS, Number(ms) || 0)
      needs.every = needs.every ? Math.min(needs.every, asked) : asked
    },
    page: () => JSON.stringify(host.pageId ? { id: host.pageId, title: live.title } : null),
    pages: (of) => {
      const parent = of || host.pageId
      return JSON.stringify(parent && host.listPages ? host.listPages(parent) : [])
    },
    members: () => {
      if (live.members === undefined) needs.members = true
      return live.members ?? undefined
    },
    me: () => {
      if (live.me === undefined) needs.me = true
      return live.me ?? undefined
    },
    file: (key = '', as = 'text') => cached(live.files, `${as}:${key}`, needs.files),
    navigate: pressed('navigate', (id = '') => host.openSheet(id)),
    act: pressed(
      'act',
      (json = '{}') => void host.runAction(JSON.parse(json) as ActionRef).catch(() => {}),
    ),
  }
}
