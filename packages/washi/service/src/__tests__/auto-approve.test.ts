import { afterEach, beforeEach, describe, expect, test } from 'bun:test'
import { openWorkspace, type Workspace } from '@washi/repository'
import { ApprovalDesk } from '../agents/approvals'
import { CapabilityDesk } from '../agents/desk'

let ws: Workspace
let desk: ApprovalDesk
beforeEach(() => {
  ws = openWorkspace({ id: 'test', path: ':memory:' })
  desk = new ApprovalDesk(ws, () => null, new CapabilityDesk(ws, () => null))
})
afterEach(() => {
  desk.dropSession('s1')
  ws.close()
})

/** Settles on the next tick, so "still waiting" is observable instead of a hang. */
const within = (promise: Promise<boolean>) =>
  Promise.race([promise, new Promise<'waiting'>((done) => setTimeout(() => done('waiting'), 10))])

describe('auto-approve waves changes through, never what leaves the server', () => {
  test('off by default: a page write waits for a person', async () => {
    expect(desk.autoApproving()).toBe(false)
    expect(await within(desk.approve('s1', 'sheet_create', { title: 'Trip' }))).toBe('waiting')
    expect(desk.list()).toHaveLength(1)
  })

  test('on: pages and tables change without asking', async () => {
    desk.setAutoApprove(true, 'user-1')
    for (const tool of ['sheet_create', 'sheet_replace', 'db_define', 'db_mutate']) {
      expect(await within(desk.approve('s1', tool, {}))).toBe(true)
    }
    expect(desk.list()).toHaveLength(0)
  })

  test('on: a fetch or an action still asks', async () => {
    desk.setAutoApprove(true, 'user-1')
    expect(await within(desk.approve('s1', 'fetch_url', { url: 'https://x.dev' }))).toBe('waiting')
    expect(await within(desk.approve('s1', 'action_run', { action: {} }))).toBe('waiting')
    expect(desk.list()).toHaveLength(2)
  })

  test('turning it on answers the changes already waiting, and only those', async () => {
    const write = desk.approve('s1', 'db_mutate', {})
    void desk.approve('s1', 'fetch_url', { url: 'https://x.dev' })
    desk.setAutoApprove(true, 'user-1')
    expect(await within(write)).toBe(true)
    expect(desk.list().map((request) => request.toolName)).toEqual(['fetch_url'])
  })

  test('it is the workspace that remembers, not the desk', () => {
    desk.setAutoApprove(true, 'user-1')
    const fresh = new ApprovalDesk(ws, () => null, new CapabilityDesk(ws, () => null))
    expect(fresh.autoApproving()).toBe(true)
  })
})
