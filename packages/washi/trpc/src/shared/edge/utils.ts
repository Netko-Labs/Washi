import type { ServerRuntime } from '../../init'
import { type Context, createContext } from '../../init'
import { WORKSPACE_HEADER } from './constants'
import type { CreateContextOptions } from './types'

/** One context factory for both edges: the session cookie says who, the header or params say where. */
export function contextFromRequest(
  runtime: ServerRuntime,
): (opts: CreateContextOptions) => Promise<Context> {
  return async ({ req, connectionParams }) =>
    createContext(runtime, {
      workspaceId: req.headers.get(WORKSPACE_HEADER) ?? connectionParams?.workspace ?? null,
      actor: runtime.mode === 'hosted' ? await runtime.control.authenticate(req) : null,
    })
}
