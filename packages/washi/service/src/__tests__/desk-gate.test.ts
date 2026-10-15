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

describe('changes land; only what leaves the server asks', () => {
  test('pages and tables change without asking', async () => {
    for (const tool of ['sheet_create', 'sheet_replace', 'db_define', 'db_mutate']) {
      expect(await within(desk.approve('s1', tool, {}))).toBe(true)
    }
    expect(desk.list()).toHaveLength(0)
  })

  test('a fetch or an action still asks', async () => {
    expect(await within(desk.approve('s1', 'fetch_url', { url: 'https://x.dev' }))).toBe('waiting')
    expect(await within(desk.approve('s1', 'action_run', { action: {} }))).toBe('waiting')
    expect(desk.list()).toHaveLength(2)
  })
})
