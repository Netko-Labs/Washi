import { describe, expect, test } from 'bun:test'
import { createModelCatalogue } from '@washi/models'
import { openWorkspace } from '@washi/repository'
import { createClaudeSdkPort, defaultModelFor, isReadTool } from '../agents/ports'

/**
 * "Two ports, one vocabulary" (§05) is only true if both ports gate the same
 * tools. These are the assertions that keep the second port from quietly
 * growing a wider capability surface than the first.
 */
describe('both ports agree on what a read is', () => {
  test('reads pass the desk without asking', () => {
    for (const name of ['sheet_list', 'sheet_get', 'sheet_check', 'search', 'db_query']) {
      expect(isReadTool(name)).toBe(true)
    }
  })

  test('every write stops at the desk', () => {
    for (const name of [
      'sheet_create',
      'sheet_replace',
      'db_define',
      'db_mutate',
      'reminder_create',
      'action_run',
    ]) {
      expect(isReadTool(name)).toBe(false)
    }
  })

  test('fetch_url is a write, because it leaves the machine', () => {
    expect(isReadTool('fetch_url')).toBe(false)
    expect(isReadTool('web_search')).toBe(false)
  })

  test('an unknown tool is never a read — the default is to ask', () => {
    expect(isReadTool('rm_rf')).toBe(false)
    expect(isReadTool('')).toBe(false)
  })
})

describe('a workspace that names no model still gets one', () => {
  const offline = createModelCatalogue({
    fetchImpl: (async () => {
      throw new Error('offline')
    }) as unknown as typeof fetch,
  })

  const serving = (models: Record<string, unknown>) =>
    createModelCatalogue({
      fetchImpl: (async () =>
        new Response(JSON.stringify({ anthropic: { id: 'anthropic', models } }), {
          status: 200,
        })) as unknown as typeof fetch,
    })

  test('a preferred model wins when the catalogue has it', async () => {
    const catalogue = serving({
      'claude-sonnet-5': { id: 'claude-sonnet-5', tool_call: true, cost: { input: 2, output: 10 } },
      cheapo: { id: 'cheapo', tool_call: true, cost: { input: 0.01, output: 0.02 } },
    })
    expect(await defaultModelFor(catalogue, 'anthropic')).toBe('claude-sonnet-5')
  })

  test('a $0 preview is never the default — cheapest-wins picks a disappointment', async () => {
    const catalogue = serving({
      'free-preview': { id: 'free-preview', tool_call: true, cost: { input: 0, output: 0 } },
      'real-model': { id: 'real-model', tool_call: true, cost: { input: 3, output: 9 } },
    })
    expect(await defaultModelFor(catalogue, 'anthropic')).toBe('real-model')
  })

  test('with nothing preferred available, the cheapest paid model is taken', async () => {
    const catalogue = serving({
      pricey: { id: 'pricey', tool_call: true, cost: { input: 90, output: 1 } },
      thrifty: { id: 'thrifty', tool_call: true, cost: { input: 1, output: 1 } },
    })
    expect(await defaultModelFor(catalogue, 'anthropic')).toBe('thrifty')
  })

  test('an unreachable catalogue still answers', async () => {
    expect(await defaultModelFor(offline, 'anthropic')).toBeString()
    expect(await defaultModelFor(offline, 'openrouter')).toContain('/')
  })

  test('an unknown provider does not throw', async () => {
    expect(await defaultModelFor(offline, 'nonesuch')).toBeString()
  })
})

describe('a Stop pressed before the turn starts', () => {
  test('never reaches the SDK', async () => {
    const ws = openWorkspace({ id: 'test', path: ':memory:' })
    const port = createClaudeSdkPort({
      ws,
      catalogue: createModelCatalogue(),
      instructions: () => '',
      runHankoAction: async () => {},
      canUseTool: async () => ({ behavior: 'deny', message: 'no' }),
    })
    const emitted: unknown[] = []
    const result = await port.prompt(
      {
        sessionId: 's',
        text: 'hi',
        credential: { kind: 'api_key', apiKey: 'sk-test', provider: 'anthropic' },
        model: { provider: 'anthropic' },
        history: [],
        signal: AbortSignal.abort(),
      },
      (update) => emitted.push(update),
    )
    ws.close()
    expect(result).toMatchObject({ cancelled: true, costUsd: null })
    expect(emitted).toEqual([])
  })
})
