import { describe, expect, test } from 'bun:test'
import type { TranscriptEntry } from '@washi/domain'
import { createEventBus, createPresenceBoard } from '@washi/trpc'
import { watchAgentWrites } from '../agent-watch'

const entry = (update: TranscriptEntry['update']) => ({ update }) as TranscriptEntry

describe('Washi in the room', () => {
  test('it shows on the page it rewrites, and its finished writes tell everyone', async () => {
    const events = createEventBus()
    const presence = createPresenceBoard(() => {})
    const watch = watchAgentWrites('w', events, presence)
    const seen: string[] = []
    const abort = new AbortController()
    const drain = (async () => {
      for await (const event of events.subscribe('workspaceChanged', { signal: abort.signal })) {
        seen.push(`${event.data.kind}:${event.data.id}`)
      }
    })().catch(() => undefined)

    watch(
      entry({
        kind: 'tool_call',
        toolCallId: 't1',
        title: 'sheet_replace',
        toolKind: 'edit',
        status: 'in_progress',
        input: { id: 'page-1' },
      }),
    )
    expect(presence.list('w', 'page-1')).toMatchObject([{ id: 'washi', agent: true }])
    watch(entry({ kind: 'tool_call_update', toolCallId: 't1', status: 'completed' }))
    watch(
      entry({
        kind: 'tool_call',
        toolCallId: 't2',
        title: 'db_mutate',
        toolKind: 'edit',
        status: 'in_progress',
        input: {},
      }),
    )
    watch(entry({ kind: 'tool_call_update', toolCallId: 't2', status: 'completed' }))
    await Bun.sleep(5)
    abort.abort()
    await drain
    expect(seen).toEqual(['page:page-1', 'data:null'])
  })
})
