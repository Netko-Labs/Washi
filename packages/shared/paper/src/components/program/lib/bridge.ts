import { stateValue } from '../../../lib/sandbox'
import type { ActionRef, ProgramLive, ProgramNeeds, SandboxBridge } from '../../../lib/types'
import type { PaperHost } from '../../../provider'
import { PROGRAM_MIN_INTERVAL_MS } from './values'

const storedKey = (page: string | undefined, key: string) => `washi:stored:${page ?? 'page'}:${key}`

function stored(key: string): string | undefined {
  try {
    return localStorage.getItem(key) ?? undefined
  } catch {
    return undefined
  }
}

/**
 * The host's side of every `__bridge_*` for one run: answers from what is already known, and notes
 * in `needs` what to fetch after the run — rows, a table's columns, the members — to draw again.
 */
export function programBridge(
  live: ProgramLive,
  host: PaperHost,
  needs: ProgramNeeds,
): SandboxBridge {
  const cached = (map: Map<string, string | null>, key: string, wanted: string[]) => {
    const known = map.get(key)
    if (known === undefined) wanted.push(key)
    return known ?? undefined
  }
  return {
    rows: (query) => cached(live.rows, query, needs.queries),
    table: (name) => cached(live.tables, name, needs.tables),
    state: (key) => (key in live.values ? JSON.stringify(live.values[key]) : undefined),
    set: (key, json) => live.set(key, stateValue(json)),
    stored: (key) => stored(storedKey(host.pageId, key)),
    store: (key, json) => {
      try {
        localStorage.setItem(storedKey(host.pageId, key), json)
      } catch {
        // Storage full or off: the value lives until the page closes, like any page state.
      }
    },
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
    navigate: (id) => host.openSheet(id),
    act: (json) => void host.runAction(JSON.parse(json) as ActionRef).catch(() => {}),
  }
}
