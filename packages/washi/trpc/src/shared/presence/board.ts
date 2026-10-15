import { PRESENCE_TTL_MS } from './constants'
import type { PresenceBoard, PresenceChanged } from './types'

/** Who is on which page, in this process's memory: presence is a heartbeat, never a record. */
export function createPresenceBoard(changed: PresenceChanged): PresenceBoard {
  const pages = new Map<string, Map<string, { person: PagePresence; until: number }>>()
  const key = (workspaceId: string, sheetId: string) => `${workspaceId}/${sheetId}`

  const list = (workspaceId: string, sheetId: string) => {
    const page = pages.get(key(workspaceId, sheetId))
    if (!page) return []
    const now = Date.now()
    for (const [id, entry] of page) if (entry.until <= now) page.delete(id)
    return [...page.values()].map((entry) => entry.person)
  }

  return {
    touch(workspaceId, sheetId, person, ttlMs = PRESENCE_TTL_MS) {
      const page = pages.get(key(workspaceId, sheetId)) ?? new Map()
      pages.set(key(workspaceId, sheetId), page)
      const before = page.get(person.id)?.person
      page.set(person.id, { person, until: Date.now() + ttlMs })
      const people = list(workspaceId, sheetId)
      if (!before || before.editing !== person.editing) changed(workspaceId, sheetId, people)
      return people
    },
    leave(workspaceId, sheetId, personId) {
      if (pages.get(key(workspaceId, sheetId))?.delete(personId)) {
        changed(workspaceId, sheetId, list(workspaceId, sheetId))
      }
    },
    list,
  }
}
