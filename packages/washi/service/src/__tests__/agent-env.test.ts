import { afterEach, describe, expect, test } from 'bun:test'
import { agentEnv, sessionConfigDir } from '../agents/lib'

const saved = { ...process.env }
afterEach(() => {
  process.env = { ...saved }
})

/**
 * query()'s `env` replaces the subprocess environment rather than merging it.
 * That is the whole reason this function exists, so these are the tests that
 * matter: what gets through, and what must not.
 */
describe('the agent subprocess gets a built environment, not an inherited one', () => {
  test('the workspace key is what the subprocess authenticates with', () => {
    expect(agentEnv('sk-ant-workspace-key').ANTHROPIC_API_KEY).toBe('sk-ant-workspace-key')
  })

  test('server secrets do not reach it', () => {
    process.env.WASHI_SECRET_KEY = 'the-master-key'
    process.env.WASHI_DATABASE_URL = 'postgres://washi:hunter2@localhost/washi'
    const env = agentEnv('sk-ant-x')
    expect(env.WASHI_SECRET_KEY).toBeUndefined()
    expect(env.WASHI_DATABASE_URL).toBeUndefined()
    expect(Object.values(env)).not.toContain('the-master-key')
  })

  test("another workspace's key cannot leak through the ambient one", () => {
    process.env.ANTHROPIC_API_KEY = 'sk-ant-someone-elses'
    expect(agentEnv('sk-ant-mine').ANTHROPIC_API_KEY).toBe('sk-ant-mine')
  })

  test('with no key resolved, none is set — the turn fails loudly instead', () => {
    process.env.ANTHROPIC_API_KEY = 'sk-ant-ambient'
    expect(agentEnv(null).ANTHROPIC_API_KEY).toBeUndefined()
  })

  test('what a process actually needs still gets through', () => {
    process.env.PATH = '/usr/bin'
    process.env.HOME = '/home/washi'
    const env = agentEnv('sk-ant-x')
    expect(env.PATH).toBe('/usr/bin')
    expect(env.HOME).toBe('/home/washi')
    expect(env.CLAUDE_AGENT_SDK_CLIENT_APP).toBe('washi/0.1.0')
  })
})

describe("a keyed turn's Claude session lives with its workspace", () => {
  test('beside the workspace file, so a redeploy keeps it', () => {
    expect(sessionConfigDir('/data/workspaces/org_1.db')).toBe('/data/workspaces/org_1.claude')
  })

  test('an in-memory workspace has nowhere to keep one', () => {
    expect(sessionConfigDir(':memory:')).toBeNull()
    expect(sessionConfigDir('')).toBeNull()
  })

  test('the subprocess is pointed at it, over any ambient config dir', () => {
    process.env.CLAUDE_CONFIG_DIR = '/home/someone/.claude'
    expect(agentEnv('sk-ant-x', '/data/workspaces/org_1.claude').CLAUDE_CONFIG_DIR).toBe(
      '/data/workspaces/org_1.claude',
    )
  })

  test('a local CLI keeps its own login', () => {
    process.env.CLAUDE_CONFIG_DIR = '/home/me/.claude'
    expect(agentEnv(null, null).CLAUDE_CONFIG_DIR).toBe('/home/me/.claude')
  })
})
