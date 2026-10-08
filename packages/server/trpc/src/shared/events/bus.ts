import { EVENT_BUFFER_SIZE } from './constants'
import type { EventBus, EventName, Tracked, WashiEvents } from './types'

type Waiter = () => void

export function createEventBus(): EventBus {
  const buffers = new Map<EventName, Tracked<unknown>[]>()
  const waiters = new Map<EventName, Set<Waiter>>()
  let sequence = 0

  const bufferFor = (name: EventName) => {
    const existing = buffers.get(name)
    if (existing) return existing
    const created: Tracked<unknown>[] = []
    buffers.set(name, created)
    return created
  }

  return {
    emit(name, payload) {
      sequence += 1
      const buffer = bufferFor(name)
      buffer.push({ id: String(sequence), data: payload })
      if (buffer.length > EVENT_BUFFER_SIZE) buffer.splice(0, buffer.length - EVENT_BUFFER_SIZE)
      for (const wake of waiters.get(name) ?? []) wake()
    },

    async *subscribe<K extends EventName>(
      name: K,
      options?: { lastEventId?: string | null; signal?: AbortSignal },
    ): AsyncGenerator<Tracked<WashiEvents[K]>> {
      const buffer = bufferFor(name)
      // A cursor is the last sequence seen, never a buffer index: emit trims the
      // buffer from the front, and an index would then point past the live edge.
      const requested = options?.lastEventId ? Number(options.lastEventId) : Number.NaN
      let seen = Number.isNaN(requested) ? sequence : requested

      const wakeSet = waiters.get(name) ?? new Set<Waiter>()
      waiters.set(name, wakeSet)

      try {
        while (!options?.signal?.aborted) {
          for (const event of buffer.filter((entry) => Number(entry.id) > seen)) {
            seen = Number(event.id)
            yield event as Tracked<WashiEvents[K]>
          }

          await new Promise<void>((resolve) => {
            const wake = () => {
              wakeSet.delete(wake)
              options?.signal?.removeEventListener('abort', wake)
              resolve()
            }
            wakeSet.add(wake)
            options?.signal?.addEventListener('abort', wake, { once: true })
          })
        }
      } finally {
        if (wakeSet.size === 0) waiters.delete(name)
      }
    },
  }
}
