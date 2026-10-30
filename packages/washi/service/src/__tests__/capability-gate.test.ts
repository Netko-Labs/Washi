import { afterEach, beforeEach, describe, expect, test } from 'bun:test'
import { getSheet, listCapabilityCalls, openWorkspace, type Workspace } from '@washi/repository'
import { parse } from '@washi/wsx'
import { AgentHost } from '../agents/host'
import { defineUserTable, runQuery } from '../tables/service'

let ws: Workspace
beforeEach(() => {
  ws = openWorkspace({ id: 'test', path: ':memory:' })
})
afterEach(() => ws.close())

function makeHost() {
  const opened: { id: string; sessionId: string }[] = []
  const host = new AgentHost(ws)
  host.setEvents({
    update: () => {},
    approval: () => {},
    openSheet: (id, sessionId) => opened.push({ id, sessionId }),
  })
  return { host, opened }
}

/** Spec §09 P4 + Q13: one gate for both callers, and everything leaves a row. */
describe('sheet actions pass the same desk as agent actions', () => {
  test('sheet.create keeps a hostile title as text, not markup', async () => {
    const { host, opened } = makeHost()
    const title = 'a </Title><Missing/> "q" {x} & \\'
    const made = await host.executeAction({ verb: 'sheet.create', title }, { origin: 'sheet' })
    expect(opened).toEqual([])
    const sheet = getSheet(ws, made ?? '')
    expect(sheet?.title).toBe(title)
    const root = parse(sheet?.source ?? '')
    expect(root.props.title).toBe(title)
    expect(root.children).toEqual([
      { kind: 'element', name: 'Title', props: {}, children: [{ kind: 'text', value: title }] },
    ])
  })

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

  test('a page Button copies rows through the same gate (D76)', async () => {
    const { host } = makeHost()
    defineUserTable(ws, {
      name: 'expenses',
      columns: [
        { name: 'name', type: 'text' },
        { name: 'date', type: 'date' },
        { name: 'recurring', type: 'boolean' },
        { name: 'month', type: 'formula', expr: 'month(date)' },
      ],
    })
    await host.executeAction(
      {
        verb: 'table.insert',
        table: 'expenses',
        data: { name: 'Rent', date: '2026-10-01', recurring: true },
      },
      { origin: 'sheet' },
    )

    await host.executeAction(
      {
        verb: 'table.copy',
        table: 'expenses',
        params: { from: '2026-10' },
        where: [
          { column: 'recurring', op: 'eq', value: true },
          { column: 'month', op: 'eq', value: { param: 'from' } },
        ],
        set: { date: { expr: 'add_months(date, 1)' } },
      },
      { origin: 'sheet', actorId: 'u1' },
    )

    const dates = runQuery(ws, { table: 'expenses' }).rows.map((row) => row.date)
    expect(dates).toEqual(['2026-10-01', '2026-11-01'])
    const copy = listCapabilityCalls(ws).find((call) => call.subject === 'table.copy')
    expect(copy?.decision).toBe('auto')
    expect(copy?.actorId).toBe('u1')
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

    await host.executeAction(
      { verb: 'sheet.open', sheet: '01J8' },
      { origin: 'agent', sessionId: 'chat-1' },
    )

    expect(opened).toEqual([{ id: '01J8', sessionId: 'chat-1' }])
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
