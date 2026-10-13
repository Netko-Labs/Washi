import { EVENT_BUFFER_SIZE } from './constants'
import type { EventBus, EventName, Tracked, WashiEvents } from './types'

type Waiter = () => void

export function createEventBus(): EventBus {
  const buffers = new Map<EventName, Tracked<unknown>[]>()
  const waiters = new Map<EventName, Set<Waiter>>()
  const trimmedThrough = new Map<EventName, number>()
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
      if (buffer.length > EVENT_BUFFER_SIZE) {
        const dropped = buffer.splice(0, buffer.length - EVENT_BUFFER_SIZE)
        trimmedThrough.set(name, Number(dropped.at(-1)?.id))
      }
      for (const wake of [...(waiters.get(name) ?? [])]) wake()
    },

    async *subscribe<K extends EventName>(
      name: K,
      options?: { lastEventId?: string | null; signal?: AbortSignal },
    ): AsyncGenerator<Tracked<WashiEvents[K]>> {
      const buffer = bufferFor(name)
      const signal = options?.signal
      // A cursor is the last sequence seen, never a buffer index: emit trims the
      // buffer from the front. An id this process has not reached came from a
      // previous one (a restart), and one older than the trim has a gap a partial
      // replay would hide; both resume at the live edge.
      const requested = options?.lastEventId ? Number(options.lastEventId) : Number.NaN
      const expired = requested < (trimmedThrough.get(name) ?? 0)
      let seen = Number.isNaN(requested) || requested > sequence || expired ? sequence : requested
      const next = () => buffer.find((event) => Number(event.id) > seen)

      while (!signal?.aborted) {
        // Re-read the live buffer after every yield: the consumer may be busy
        // writing to a socket while new events land.
        for (let event = next(); event; event = next()) {
          seen = Number(event.id)
          yield event as Tracked<WashiEvents[K]>
        }

        // Registered with no await since the last check, so no emit falls between.
        await new Promise<void>((resolve) => {
          const set = waiters.get(name) ?? new Set<Waiter>()
          waiters.set(name, set)
          const wake = () => {
            set.delete(wake)
            signal?.removeEventListener('abort', wake)
            if (set.size === 0 && waiters.get(name) === set) waiters.delete(name)
            resolve()
          }
          set.add(wake)
          signal?.addEventListener('abort', wake, { once: true })
        })
      }
    },
  }
}
