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
      bus.emit('openSheetRequested', { workspaceId: 'w', sessionId: 's', id: `old-${i}` })
    }
    const seen = await drain(bus, null, () => {
      for (const id of ['a', 'b', 'c'])
        bus.emit('openSheetRequested', { workspaceId: 'w', sessionId: 's', id })
    })
    expect(seen).toEqual(['a', 'b', 'c'])
  })

  test('a subscriber already listening keeps up while the buffer trims under it', async () => {
    const bus = createEventBus()
    const total = EVENT_BUFFER_SIZE * 2
    const seen = await drain(bus, null, () => {
      for (let i = 0; i < total; i += 1) {
        bus.emit('openSheetRequested', { workspaceId: 'w', sessionId: 's', id: String(i) })
      }
    })
    // It may miss nothing it was awake for; at minimum the newest must arrive.
    expect(seen.at(-1)).toBe(String(total - 1))
  })

  test('a reconnect resumes after lastEventId', async () => {
    const bus = createEventBus()
    for (const id of ['a', 'b', 'c'])
      bus.emit('openSheetRequested', { workspaceId: 'w', sessionId: 's', id })
    const seen = await drain(bus, '1', () => {})
    expect(seen).toEqual(['b', 'c'])
  })
})

describe('the bus never sleeps through an event', () => {
  test('a slow consumer still gets what was emitted while it was busy', async () => {
    const bus = createEventBus()
    const abort = new AbortController()
    const seen: string[] = []
    const reading = (async () => {
      for await (const event of bus.subscribe('openSheetRequested', { signal: abort.signal })) {
        seen.push(event.data.id)
        await Bun.sleep(5) // an SSE write in flight
      }
    })()
    await Bun.sleep(1)
    bus.emit('openSheetRequested', { workspaceId: 'w', sessionId: 's', id: 'first' })
    await Bun.sleep(1)
    bus.emit('openSheetRequested', { workspaceId: 'w', sessionId: 's', id: 'while-busy' })
    await Bun.sleep(30)
    abort.abort()
    await reading
    expect(seen).toEqual(['first', 'while-busy'])
  })

  test('a lastEventId from before a restart resumes at the live edge, not in silence', async () => {
    const bus = createEventBus()
    const seen = await drain(bus, '8123', () => {
      for (const id of ['a', 'b'])
        bus.emit('openSheetRequested', { workspaceId: 'w', sessionId: 's', id })
    })
    expect(seen).toEqual(['a', 'b'])
  })

  test('a lastEventId older than the buffer resumes at the live edge, not mid-gap', async () => {
    const bus = createEventBus()
    for (let i = 0; i < EVENT_BUFFER_SIZE + 10; i += 1) {
      bus.emit('openSheetRequested', { workspaceId: 'w', sessionId: 's', id: `old-${i}` })
    }
    const seen = await drain(bus, '1', () => {
      for (const id of ['a', 'b'])
        bus.emit('openSheetRequested', { workspaceId: 'w', sessionId: 's', id })
    })
    expect(seen).toEqual(['a', 'b'])
  })

  test('a cursor still inside the buffer replays even when other events share the sequence', async () => {
    const bus = createEventBus()
    bus.emit('devCommand', { command: 'reload' })
    for (const id of ['a', 'b'])
      bus.emit('openSheetRequested', { workspaceId: 'w', sessionId: 's', id })
    const seen = await drain(bus, '2', () => {})
    expect(seen).toEqual(['b'])
  })

  test('one subscriber ending never silences another on the same event', async () => {
    const bus = createEventBus()
    const quitter = new AbortController()
    const stayer = new AbortController()
    const seen: string[] = []
    const quitting = (async () => {
      for await (const _ of bus.subscribe('openSheetRequested', { signal: quitter.signal })) {
        // drains and leaves
      }
    })()
    const staying = (async () => {
      for await (const event of bus.subscribe('openSheetRequested', { signal: stayer.signal })) {
        seen.push(event.data.id)
        await Bun.sleep(5)
      }
    })()
    await Bun.sleep(1)
    bus.emit('openSheetRequested', { workspaceId: 'w', sessionId: 's', id: '1' })
    await Bun.sleep(1)
    quitter.abort()
    await quitting
    await Bun.sleep(10)
    bus.emit('openSheetRequested', { workspaceId: 'w', sessionId: 's', id: '2' })
    await Bun.sleep(20)
    stayer.abort()
    await staying
    expect(seen).toEqual(['1', '2'])
  })
})
