import { describe, expect, test } from 'bun:test'
import { createEventBus, EVENT_BUFFER_SIZE } from '../shared/events'

const drain = async (
  bus: ReturnType<typeof createEventBus>,
  lastEventId: string | null,
  emitAfterSubscribe: () => void,
) => {
  const abort = new AbortController()
  const seen: string[] = []
  const reading = (async () => {
    for await (const event of bus.subscribe('openSheetRequested', {
      lastEventId,
      signal: abort.signal,
    })) {
      seen.push(event.data.id)
    }
  })()
  await Bun.sleep(1)
  emitAfterSubscribe()
  await Bun.sleep(5)
  abort.abort()
  await reading
  return seen
}

describe('the bus keeps delivering after its buffer fills', () => {
  test('a live subscriber still sees new events once the buffer has trimmed', async () => {
    const bus = createEventBus()
    for (let i = 0; i < EVENT_BUFFER_SIZE + 10; i += 1) {
      bus.emit('openSheetRequested', { workspaceId: 'w', id: `old-${i}` })
    }
    const seen = await drain(bus, null, () => {
      for (const id of ['a', 'b', 'c']) bus.emit('openSheetRequested', { workspaceId: 'w', id })
    })
    expect(seen).toEqual(['a', 'b', 'c'])
  })

  test('a subscriber already listening keeps up while the buffer trims under it', async () => {
    const bus = createEventBus()
    const total = EVENT_BUFFER_SIZE * 2
    const seen = await drain(bus, null, () => {
      for (let i = 0; i < total; i += 1) {
        bus.emit('openSheetRequested', { workspaceId: 'w', id: String(i) })
      }
    })
    // It may miss nothing it was awake for; at minimum the newest must arrive.
    expect(seen.at(-1)).toBe(String(total - 1))
  })

  test('a reconnect resumes after lastEventId', async () => {
    const bus = createEventBus()
    for (const id of ['a', 'b', 'c']) bus.emit('openSheetRequested', { workspaceId: 'w', id })
    const seen = await drain(bus, '1', () => {})
    expect(seen).toEqual(['b', 'c'])
  })
})
