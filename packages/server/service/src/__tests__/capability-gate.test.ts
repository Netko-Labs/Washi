import { afterEach, beforeEach, describe, expect, test } from 'bun:test'
import { listCapabilityCalls, openWorkspace, type Workspace } from '@washi/repository'
import { AgentHost } from '../agents/host'
import { defineUserTable, runQuery } from '../tables/service'

let ws: Workspace
beforeEach(() => {
  ws = openWorkspace({ id: 'test', path: ':memory:' })
})
afterEach(() => ws.close())

function makeHost() {
  const opened: string[] = []
  const host = new AgentHost(ws)
  host.setEvents({
    update: () => {},
    approval: () => {},
    openSheet: (id) => opened.push(id),
  })
  return { host, opened }
}

/** Spec §09 P4 + Q13: one gate for both callers, and everything leaves a row. */
describe('sheet actions pass the same desk as agent actions', () => {
  test('a click runs reversible in-vault verbs and ledgers them', async () => {
    const { host } = makeHost()
    defineUserTable(ws, { name: 'tasks', columns: [{ name: 'title', type: 'text' }] })

    await host.executeAction(
      { verb: 'table.insert', table: 'tasks', data: { title: 'a' } },
      { origin: 'sheet' },
    )

    expect(runQuery(ws, { table: 'tasks' }).rows).toHaveLength(1)
    const [call] = listCapabilityCalls(ws)
    expect(call?.subject).toBe('table.insert')
    expect(call?.origin).toBe('sheet')
    expect(call?.decision).toBe('auto')
  })

  test('a sheet cannot run a verb that leaves the machine', async () => {
    const { host } = makeHost()

    await expect(
      host.executeAction({ verb: 'url.open', url: 'https://example.com' }, { origin: 'sheet' }),
    ).rejects.toThrow(/leaves this machine/)

    const [call] = listCapabilityCalls(ws)
    expect(call?.subject).toBe('url.open')
    expect(call?.decision).toBe('denied')
  })

  test('the same verb is allowed from the agent, which canUseTool already stamped', async () => {
    const { host, opened } = makeHost()

    await host.executeAction({ verb: 'sheet.open', sheet: '01J8' }, { origin: 'agent' })

    expect(opened).toEqual(['01J8'])
    expect(listCapabilityCalls(ws)[0]?.decision).toBe('allowed')
  })

  test('invalid verbs are refused and still leave a row', async () => {
    const { host } = makeHost()

    await expect(
      host.executeAction({ verb: 'rm.rf', path: '/' }, { origin: 'sheet' }),
    ).rejects.toThrow()

    const [call] = listCapabilityCalls(ws)
    expect(call?.subject).toBe('action.invalid')
    expect(call?.decision).toBe('denied')
  })
})
