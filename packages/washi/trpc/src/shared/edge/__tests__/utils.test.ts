import { describe, expect, test } from 'bun:test'
import type { ServerRuntime } from '../../../init'
import { WORKSPACE_HEADER } from '../constants'
import { contextFromRequest } from '../utils'

const runtimeAs = (mode: 'hosted' | 'embedded') =>
  ({
    mode,
    defaultWorkspaceId: 'default',
    control: { authenticate: async () => ({ id: 'a1', email: 'a@x.dev', name: 'A' }) },
  }) as unknown as ServerRuntime

const request = (headers: Record<string, string> = {}) =>
  new Request('http://app.test/api/trpc/x', { headers })

describe('one context for both edges', () => {
  test('HTTP names its workspace in the header', async () => {
    const ctx = await contextFromRequest(runtimeAs('hosted'))({
      req: request({ [WORKSPACE_HEADER]: 'org_1' }),
    })
    expect(ctx.workspaceId).toBe('org_1')
    expect(ctx.actorId).toBe('a1')
  })

  test('a socket names it in connectionParams', async () => {
    const ctx = await contextFromRequest(runtimeAs('hosted'))({
      req: request(),
      connectionParams: { workspace: 'org_2' },
    })
    expect(ctx.workspaceId).toBe('org_2')
  })

  test('embedded never authenticates and falls back to its one workspace', async () => {
    const ctx = await contextFromRequest(runtimeAs('embedded'))({ req: request() })
    expect(ctx.actorId).toBeNull()
    expect(ctx.workspaceId).toBe('default')
  })
})
