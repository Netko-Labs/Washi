import { type AnyRouter, getTRPCErrorFromUnknown, type inferRouterContext } from '@trpc/server'
import { getErrorShape, isTrackedEnvelope } from '@trpc/server/unstable-core-do-not-import'
import type { MirinCall, MirinCallResult, MirinFrame, MirinStart } from './types'

interface MirinBridgeOptions<TRouter extends AnyRouter> {
  router: TRouter
  createContext: () => Promise<inferRouterContext<TRouter>> | inferRouterContext<TRouter>
  emit: (frame: MirinFrame) => void
}

type Callable = (input: unknown) => Promise<unknown>

/** A caller, walked by path: every middleware and input parser runs exactly as over HTTP. */
function procedureAt(caller: unknown, path: string): Callable {
  let node: unknown = caller
  for (const segment of path.split('.')) {
    node = (node as Record<string, unknown>)[segment]
  }
  if (typeof node !== 'function') throw new Error(`no procedure at "${path}"`)
  return node as Callable
}

/**
 * The main-process half of tRPC over mirin IPC. The renderer never reaches a socket or a port:
 * it calls these, and subscriptions come back as frames on one event, keyed by the client's id.
 */
export function createMirinBridge<TRouter extends AnyRouter>(opts: MirinBridgeOptions<TRouter>) {
  const running = new Map<string, AbortController>()
  const shape = (error: unknown, path: string, type: MirinCall['type'] | 'subscription') =>
    getErrorShape({
      config: opts.router._def._config,
      error: getTRPCErrorFromUnknown(error),
      type,
      path,
      input: undefined,
      ctx: undefined,
    })

  return {
    async call(op: MirinCall): Promise<MirinCallResult> {
      try {
        const caller = opts.router.createCaller(await opts.createContext())
        return { ok: true, data: await procedureAt(caller, op.path)(op.input) }
      } catch (error) {
        return { ok: false, error: shape(error, op.path, op.type) }
      }
    },

    async start(op: MirinStart): Promise<void> {
      const abort = new AbortController()
      running.get(op.id)?.abort()
      running.set(op.id, abort)
      try {
        const caller = opts.router.createCaller(await opts.createContext(), {
          signal: abort.signal,
        })
        const iterable = (await procedureAt(caller, op.path)(op.input)) as AsyncIterable<unknown>
        for await (const value of iterable) {
          if (abort.signal.aborted) break
          if (isTrackedEnvelope(value)) {
            const [trackedId, data] = value
            opts.emit({ id: op.id, type: 'data', data, trackedId: String(trackedId) })
          } else {
            opts.emit({ id: op.id, type: 'data', data: value })
          }
        }
        opts.emit({ id: op.id, type: 'stopped' })
      } catch (error) {
        if (!abort.signal.aborted)
          opts.emit({ id: op.id, type: 'error', error: shape(error, op.path, 'subscription') })
      } finally {
        if (running.get(op.id) === abort) running.delete(op.id)
      }
    },

    async stop(op: { id: string }): Promise<void> {
      running.get(op.id)?.abort()
      running.delete(op.id)
    },

    /** Every live subscription, ended — on window close or shutdown. */
    stopAll(): void {
      for (const abort of running.values()) abort.abort()
      running.clear()
    },
  }
}
