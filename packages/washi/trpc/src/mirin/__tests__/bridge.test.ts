import { describe, expect, test } from 'bun:test'
import { createTRPCClient, TRPCClientError } from '@trpc/client'
import { initTRPC, TRPCError, tracked } from '@trpc/server'
import { z } from 'zod'
import { mirinLink } from '../link'
import { createMirinBridge } from '../server'
import type { MirinFrame, MirinTransport } from '../types'

const t = initTRPC.context<{ who: string }>().create()
let stopped = false
const router = t.router({
  hello: t.procedure
    .input(z.object({ name: z.string() }))
    .query(({ input, ctx }) => `${ctx.who} → ${input.name}`),
  missing: t.procedure.mutation(() => {
    throw new TRPCError({ code: 'NOT_FOUND', message: 'no such sheet' })
  }),
  ticks: t.procedure.subscription(async function* ({ signal }) {
    try {
      for (let i = 1; ; i++) {
        yield tracked(String(i), i)
        await new Promise((r) => setTimeout(r, 5))
        if (signal?.aborted) return
      }
    } finally {
      stopped = true
    }
  }),
})

function wire() {
  const listeners = new Set<(frame: MirinFrame) => void>()
  const bridge = createMirinBridge({
    router,
    createContext: () => ({ who: 'main' }),
    emit: (frame) => {
      for (const listener of listeners) listener(frame)
    },
  })
  const transport: MirinTransport = {
    call: (op) => bridge.call(op),
    start: (op) => bridge.start(op),
    stop: (op) => bridge.stop(op),
    onFrame: (listener) => {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },
  }
  return createTRPCClient<typeof router>({ links: [mirinLink(transport)] })
}

describe('tRPC over mirin IPC', () => {
  test('a query runs through the caller, context and all', async () => {
    expect(await wire().hello.query({ name: 'renderer' })).toBe('main → renderer')
  })

  test('input validation and typed errors cross unchanged', async () => {
    const api = wire()
    const invalid = await api.hello.query({ name: 1 as unknown as string }).catch((e) => e)
    expect(invalid).toBeInstanceOf(TRPCClientError)
    expect(invalid.data?.code).toBe('BAD_REQUEST')
    const missing = await api.missing.mutate().catch((e) => e)
    expect(missing.data?.code).toBe('NOT_FOUND')
    expect(missing.message).toBe('no such sheet')
  })

  test('a subscription streams tracked frames and stops when the renderer lets go', async () => {
    stopped = false
    const seen: { data: number; id?: string }[] = []
    const sub = wire().ticks.subscribe(undefined, {
      onData: (value) => seen.push(value as { data: number; id?: string }),
    })
    while (seen.length < 3) await new Promise((r) => setTimeout(r, 5))
    sub.unsubscribe()
    await new Promise((r) => setTimeout(r, 30))
    expect(seen.slice(0, 3).map((v) => v.data)).toEqual([1, 2, 3])
    expect(seen[0]?.id).toBe('1')
    expect(stopped).toBe(true)
  })
})
