import { TRPCClientError, type TRPCLink } from '@trpc/client'
import type { AnyRouter } from '@trpc/server'
import { observable } from '@trpc/server/observable'
import type { MirinTransport } from './types'

/**
 * The renderer half of tRPC over mirin IPC: a terminating link, so `api.*` and `useTRPC()` read
 * the same on the desktop as on the web — only the transport under them differs.
 */
export function mirinLink<TRouter extends AnyRouter>(transport: MirinTransport): TRPCLink<TRouter> {
  return () =>
    ({ op }) =>
      observable((observer) => {
        if (op.type === 'subscription') {
          const id = crypto.randomUUID()
          const off = transport.onFrame((frame) => {
            if (frame.id !== id) return
            if (frame.type === 'data') {
              // tRPC's own links hand a tracked value over as { id, data }; so does this one.
              const data =
                frame.trackedId === undefined
                  ? frame.data
                  : { id: frame.trackedId, data: frame.data }
              observer.next({ result: { type: 'data', data, id: frame.trackedId } })
            } else if (frame.type === 'error') {
              observer.error(TRPCClientError.from({ error: frame.error }))
            } else {
              observer.complete()
            }
          })
          transport.start({ id, path: op.path, input: op.input }).catch((cause: unknown) => {
            observer.error(
              TRPCClientError.from(cause instanceof Error ? cause : new Error(String(cause))),
            )
          })
          return () => {
            off()
            void transport.stop({ id })
          }
        }

        transport
          .call({ path: op.path, type: op.type, input: op.input })
          .then((result) => {
            if (result.ok) {
              observer.next({ result: { type: 'data', data: result.data } })
              observer.complete()
            } else {
              observer.error(TRPCClientError.from({ error: result.error }))
            }
          })
          .catch((cause: unknown) => {
            observer.error(
              TRPCClientError.from(cause instanceof Error ? cause : new Error(String(cause))),
            )
          })
        return () => {}
      })
}
