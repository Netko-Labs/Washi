import { afterEach, beforeEach, describe, expect, test } from 'bun:test'
import { liveShareFor, openWorkspace, type Workspace } from '@washi/repository'
import { updateSheetAccess } from '../sheets/look'
import { createSheetFromSource } from '../sheets/service'
import {
  ShareGoneError,
  ShareRefusedError,
  sharedPage,
  sharedQuery,
  sharedTable,
  shareSettings,
} from '../sheets/share'
import { defineUserTable, runMutation } from '../tables/service'

let ws: Workspace
beforeEach(() => {
  ws = openWorkspace({ id: 'test', path: ':memory:' })
  defineUserTable(ws, {
    name: 'deals',
    columns: [
      { name: 'client', type: 'text' },
      { name: 'amount', type: 'number' },
      { name: 'in_thousands', type: 'formula', expr: 'amount / 1000' },
      { name: 'big', type: 'formula', expr: 'in_thousands > 10' },
      { name: 'label', type: 'formula', expr: "client + ' deal'" },
    ],
  })
  runMutation(ws, { kind: 'insert', table: 'deals', data: { client: 'Acme', amount: 40000 } })
  defineUserTable(ws, { name: 'salaries', columns: [{ name: 'who', type: 'text' }] })
})
afterEach(() => ws.close())

const SOURCE = `<Sheet title="Pipeline" visibility="private" access={["rin"]}>
  <Text>Two deals this quarter.</Text>
  <Redact reason="names"><Text>Acme and Kōbō signed.</Text></Redact>
  <Table bind={{ table: "deals" }} redact={["amount"]} />
</Sheet>`

function publicPage(parentId: string | null = null) {
  const sheet = createSheetFromSource(ws, { title: 'Pipeline', source: SOURCE }, parentId)
  updateSheetAccess(ws, sheet.id, { visibility: 'public', access: [] }, 'rin')
  return { id: sheet.id, token: liveShareFor(ws, sheet.id)?.token ?? '' }
}

describe('a shared link (D65)', () => {
  test('arrives with redactions emptied and no list of readers', () => {
    const { token } = publicPage()
    const page = sharedPage(ws, token)
    expect(page.source).toContain('Two deals this quarter.')
    expect(page.source).not.toContain('Acme and Kōbō')
    expect(page.source).toContain('reason="names"')
    expect(page.source).not.toContain('access')
    expect(page.source).not.toContain('rin')
  })

  test('reads the page’s own tables, without their redacted columns', () => {
    const { token } = publicPage()
    const rows = sharedQuery(ws, token, { table: 'deals' }).rows
    expect(rows[0]).toMatchObject({ client: 'Acme' })
    expect(rows[0]).not.toHaveProperty('amount')
    expect(sharedTable(ws, token, 'deals')?.columns.map((column) => column.name)).toEqual([
      'client',
      'label',
    ])
  })

  test('a rollup over a table the page does not show stays off the link, and so do its formulas (D74)', () => {
    defineUserTable(ws, {
      name: 'deals',
      columns: [
        { name: 'client', type: 'text' },
        { name: 'amount', type: 'number' },
        {
          name: 'paid_out',
          type: 'rollup',
          rollup: { table: 'salaries', via: 'who', on: 'client', fn: 'count' },
        },
        { name: 'busy', type: 'formula', expr: 'paid_out > 0' },
      ],
    })
    const { token } = publicPage()
    const row = sharedQuery(ws, token, { table: 'deals' }).rows[0]
    expect(row).toMatchObject({ client: 'Acme' })
    expect(row).not.toHaveProperty('paid_out')
    expect(row).not.toHaveProperty('busy')
  })

  test('a formula that reads a redacted column is redacted too, however indirectly (D73)', () => {
    const { token } = publicPage()
    const rows = sharedQuery(ws, token, { table: 'deals' }).rows
    expect(rows[0]).toMatchObject({ client: 'Acme', label: 'Acme deal' })
    expect(rows[0]).not.toHaveProperty('in_thousands')
    expect(rows[0]).not.toHaveProperty('big')
    expect(() =>
      sharedQuery(ws, token, {
        table: 'deals',
        where: [{ column: 'big', op: 'eq', value: true }],
      }),
    ).toThrow(ShareRefusedError)
  })

  test('refuses another table, and any question about a redacted column', () => {
    const { token } = publicPage()
    expect(() => sharedQuery(ws, token, { table: 'salaries' })).toThrow(ShareRefusedError)
    expect(() =>
      sharedQuery(ws, token, {
        table: 'deals',
        where: [{ column: 'amount', op: 'gt', value: 30000 }],
      }),
    ).toThrow(ShareRefusedError)
    expect(() =>
      sharedQuery(ws, token, {
        table: 'deals',
        groupBy: { column: 'client', aggregates: [{ fn: 'sum', column: 'amount' }] },
      }),
    ).toThrow(ShareRefusedError)
  })

  test('dies when the page stops being public, or sits under a private page', () => {
    const { id, token } = publicPage()
    updateSheetAccess(ws, id, { visibility: 'shared', access: [] }, 'rin')
    expect(() => sharedPage(ws, token)).toThrow(ShareGoneError)

    const parent = createSheetFromSource(ws, {
      title: 'Vault',
      source: SOURCE.replace('Pipeline', 'Vault'),
    })
    const child = publicPage(parent.id)
    expect(() => sharedPage(ws, child.token)).toThrow(ShareGoneError)
  })
})

describe('a secret tab (D127)', () => {
  const Tabbed = `<Sheet title="Clinic" state={{ local: { view: "Ledger" } }}>
  <Tabs labels={["Week", "Ledger"]} state="view">
    <Tab><Table bind={{ table: "deals" }} /></Tab>
    <Tab secret><Text>Fees we charge.</Text><Table bind={{ table: "salaries" }} /></Tab>
  </Tabs>
</Sheet>`

  function tabbedPage() {
    const sheet = createSheetFromSource(ws, { title: 'Clinic', source: Tabbed }, null)
    updateSheetAccess(ws, sheet.id, { visibility: 'public', access: [] }, 'rin')
    return { id: sheet.id, token: liveShareFor(ws, sheet.id)?.token ?? '' }
  }

  test('never leaves for a link: not its panel, not its label, not as the starting tab', () => {
    const { token } = tabbedPage()
    const { source } = sharedPage(ws, token)
    expect(source).toContain('Week')
    expect(source).not.toContain('Ledger')
    expect(source).not.toContain('Fees we charge')
    expect(source).not.toContain('secret')
  })

  test('only its own strip’s state is scrubbed, never a shown tab’s value elsewhere', () => {
    const sheet = createSheetFromSource(
      ws,
      {
        title: 'Two strips',
        source: `<Sheet title="Two strips" state={{ local: { a: "Notes", b: "Notes" } }}>
  <Tabs labels={["Week", "Notes"]} state="a"><Tab><Text>w</Text></Tab><Tab secret><Text>shut</Text></Tab></Tabs>
  <Tabs labels={["Plan", "Notes"]} state="b"><Tab><Text>p</Text></Tab><Tab><Text>open notes</Text></Tab></Tabs>
</Sheet>`,
      },
      null,
    )
    updateSheetAccess(ws, sheet.id, { visibility: 'public', access: [] }, 'rin')
    const { source } = sharedPage(ws, liveShareFor(ws, sheet.id)?.token ?? '')
    expect(source).not.toContain('shut')
    expect(source).toContain('open notes')
    expect(source).toContain(`"b":"Notes"`)
    expect(source).not.toContain(`"a":"Notes"`)
  })

  test('a table only it shows cannot be asked about through the link', () => {
    const { token } = tabbedPage()
    expect(sharedQuery(ws, token, { table: 'deals' }).rows).toHaveLength(1)
    expect(() => sharedQuery(ws, token, { table: 'salaries' })).toThrow(ShareRefusedError)
  })

  test('the Share popover counts it', () => {
    const { id } = tabbedPage()
    expect(shareSettings(ws, id).hidden).toEqual({ blocks: 0, tabs: 1, columns: {} })
  })

  test('a strip of secret tabs alone is gone whole', () => {
    const sheet = createSheetFromSource(
      ws,
      {
        title: 'Notes',
        source:
          '<Sheet title="Notes"><Text>Open.</Text><Tabs labels={["A"]}><Tab secret><Text>Shut.</Text></Tab></Tabs></Sheet>',
      },
      null,
    )
    updateSheetAccess(ws, sheet.id, { visibility: 'public', access: [] }, 'rin')
    const { source } = sharedPage(ws, liveShareFor(ws, sheet.id)?.token ?? '')
    expect(source).toContain('Open.')
    expect(source).not.toContain('Tabs')
    expect(source).not.toContain('Shut.')
  })
})
