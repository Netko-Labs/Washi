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
      const after = options?.lastEventId ? Number(options.lastEventId) : Number.NaN
      // Resume point: the first buffered event newer than lastEventId, or the
      // live edge when the client is caught up (or its id has aged out).
      let cursor = Number.isNaN(after)
        ? buffer.length
        : Math.max(
            0,
            buffer.findIndex((event) => Number(event.id) > after),
          )
      if (!Number.isNaN(after) && buffer.every((event) => Number(event.id) <= after)) {
        cursor = buffer.length
      }

      const wakeSet = waiters.get(name) ?? new Set<Waiter>()
      waiters.set(name, wakeSet)

      try {
        while (!options?.signal?.aborted) {
          while (cursor < buffer.length) {
            const event = buffer[cursor]
            cursor += 1
            if (event) yield event as Tracked<WashiEvents[K]>
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
