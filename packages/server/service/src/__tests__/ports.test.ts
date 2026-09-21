import { describe, expect, test } from 'bun:test'
import { DEFAULT_MODELS, isReadTool } from '../agents/ports'

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
    for (const name of ['sheet_create', 'sheet_replace', 'db_define', 'db_mutate', 'action_run']) {
      expect(isReadTool(name)).toBe(false)
    }
  })

  test('fetch_url is a write, because it leaves the machine', () => {
    expect(isReadTool('fetch_url')).toBe(false)
  })

  test('an unknown tool is never a read — the default is to ask', () => {
    expect(isReadTool('rm_rf')).toBe(false)
    expect(isReadTool('')).toBe(false)
  })
})

describe('providers', () => {
  test('each has a default model, so a key alone is enough to start', () => {
    expect(DEFAULT_MODELS.anthropic).toBeString()
    expect(DEFAULT_MODELS.openrouter).toContain('/')
  })
})
