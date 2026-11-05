import { afterEach, beforeEach, describe, expect, test } from 'bun:test'
import { liveShareFor, openWorkspace, type Workspace } from '@washi/repository'
import { parse } from '@washi/wsx'
import { updateSheetAccess, updateSheetShareSubpages } from '../sheets/look'
import { createSheetFromSource } from '../sheets/service'
import { ShareRefusedError, sharedQuery } from '../sheets/share'
import { sharedCompile } from '../sheets/share-code'
import { codeTables } from '../sheets/share-tables'
import { defineUserTable, runMutation } from '../tables/service'

let ws: Workspace
beforeEach(() => {
  ws = openWorkspace({ id: 'test', path: ':memory:' })
  for (const name of ['tasks', 'salaries', 'notes']) {
    defineUserTable(ws, { name, columns: [{ name: 'title', type: 'text' }] })
    runMutation(ws, { kind: 'insert', table: name, data: { title: `a ${name} row` } })
  }
})
afterEach(() => ws.close())

const CODE = `import { useRows } from 'washi'

const open = () => useRows({ table: 'tasks' })

<Sheet title="Board">
  <Text>{\`\${open().length} open\`}</Text>
  <Text>Our notes are elsewhere.</Text>
</Sheet>`

function publicPage(source: string, parentId: string | null = null) {
  const sheet = createSheetFromSource(ws, { title: 'Board', source }, parentId)
  updateSheetAccess(ws, sheet.id, { visibility: 'public', access: [] }, 'rin')
  return { id: sheet.id, token: liveShareFor(ws, sheet.id)?.token ?? '' }
}

describe("a page's code on its link (D125)", () => {
  test('compiles from the server’s own copy of the page', async () => {
    const { token } = publicPage(CODE)
    const compiled = await sharedCompile(ws, token)
    expect(compiled.ok).toBe(true)
    if (compiled.ok) expect(compiled.js).toContain('__page')
  })

  test('reads the tables its code names as tables, and no other', () => {
    const { token } = publicPage(CODE)
    expect([...codeTables(ws, parse(CODE))]).toEqual(['tasks'])
    expect(sharedQuery(ws, token, { table: 'tasks' }).rows[0]).toMatchObject({
      title: 'a tasks row',
    })
    // A word that happens to be a table's name, in prose, opens nothing.
    expect(() => sharedQuery(ws, token, { table: 'notes' })).toThrow(ShareRefusedError)
    expect(() => sharedQuery(ws, token, { table: 'salaries' })).toThrow(ShareRefusedError)
  })

  test('a page: import resolves only to a page the link opens', async () => {
    const helpers = `export const greet = () => 'hi'\n\n<Sheet title="Helpers"><Text>x</Text></Sheet>`
    const importing = (id: string) =>
      `import { greet } from 'page:${id}'\n\n<Sheet title="Board"><Text>{greet()}</Text></Sheet>`
    const elsewhere = createSheetFromSource(ws, { title: 'Helpers', source: helpers }).id
    const outside = publicPage(importing(elsewhere))
    const refused = await sharedCompile(ws, outside.token)
    expect(refused.ok).toBe(false)
    if (!refused.ok) expect(refused.error).toContain('not a page you can read')

    // A sub-page of the shared page, on its link once it shares them, resolves.
    const home = publicPage('<Sheet title="Board"><Text>x</Text></Sheet>')
    const sub = createSheetFromSource(ws, { title: 'Helpers', source: helpers }, home.id).id
    const user = createSheetFromSource(ws, { title: 'Uses', source: importing(sub) }, home.id).id
    expect((await sharedCompile(ws, home.token, user).catch(() => ({ ok: false }))).ok).toBe(false)
    updateSheetShareSubpages(ws, home.id, true)
    expect((await sharedCompile(ws, home.token, user)).ok).toBe(true)
  })
})
