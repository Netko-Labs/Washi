import { afterEach, beforeEach, describe, expect, test } from 'bun:test'
import { createSheet, getAppMeta, getSheet, openWorkspace, type Workspace } from '@washi/repository'
import { hasCode, parse } from '@washi/wsx'
import { compilePage } from '../pages'
import { loadEngine } from '../scripts/engine'
import { liftScriptsIntoCode } from '../sheets/scripts-to-code'
import { checkSource } from '../sheets/service'

let ws: Workspace
beforeEach(() => {
  ws = openWorkspace({ id: 'test', path: ':memory:' })
})
afterEach(() => ws.close())

const COUNTER = `function view() {
  const [n, setN] = useState('n', 0)
  return <Button onPress={() => setN(n + 1)}>Pressed {n} at {now() > 0 ? 'now' : 'never'}</Button>
}`
const CLOCK = 'function view() {\n  useInterval(1000)\n  return <Text>tick</Text>\n}'

const OLD = `<Sheet title="Lab" icon="🦊">
  <Title>Lab</Title>
  <Script title="Counter">{\`${COUNTER}\`}</Script>
  <Columns><Column><Script>{\`${CLOCK}\`}</Script></Column><Column><Text>beside</Text></Column></Columns>
</Sheet>`

/** The migrated page as a reader's sandbox runs it: page state answers `n`, no fetches. */
async function draw(source: string): Promise<unknown> {
  const compiled = await compilePage(source, () => null)
  if (!compiled.ok) throw new Error(compiled.error)
  const vm = (await loadEngine()).newContext()
  const prelude = `
for (const name of ['Sheet', 'Title', 'Section', 'Button', 'Text', 'Columns', 'Column']) globalThis[name] = name
globalThis.__h = (name, props, ...kids) => typeof name === 'function'
  ? name({ ...props, children: kids })
  : { name, props: props || {}, children: kids.flat() }
globalThis.__washi = {
  usePageState: (key, initial) => [key === 'n' ? 4 : initial, () => {}],
  useRows: () => [], useInterval: () => {}, act: () => {},
}`
  const result = vm.evalCode(`${prelude};\n${compiled.js}\nJSON.stringify(__page.view())`)
  const value = result.error ? vm.dump(result.error) : JSON.parse(vm.dump(result.value))
  ;(result.error ?? result.value).dispose()
  vm.dispose()
  return value
}

describe('Scripts become the page’s own code, once (D100)', () => {
  test('each Script is a component of the page, where it stood, running as it did', async () => {
    const sheet = createSheet(ws, { title: 'Lab', source: OLD }, { body: 'Lab', refs: [] })
    liftScriptsIntoCode(ws)
    const source = getSheet(ws, sheet.id)?.source ?? ''
    const root = parse(source)

    expect(hasCode(root)).toBe(true)
    expect(source).toContain(
      "import { usePageState as useState, useRows, useInterval, act } from 'washi'",
    )
    expect(root.prelude?.components).toEqual(['Script1', 'Script2'])
    expect(root.props).toMatchObject({ title: 'Lab', icon: '🦊' })
    expect(root.children[1]).toMatchObject({
      name: 'Section',
      props: { title: 'Counter' },
      children: [{ name: 'Script1' }],
    })
    expect(checkSource(source).ok).toBe(true)
    expect(getAppMeta(ws, 'scripts_as_code')).toBe('1')

    expect(await draw(source)).toMatchObject({
      children: [
        { name: 'Title' },
        {
          name: 'Section',
          children: [{ name: 'Button', children: ['Pressed ', 4, ' at ', 'now'] }],
        },
        { name: 'Columns' },
      ],
    })
  })

  test('a page wrong in some other way is left as it was, and tried again at the next open', () => {
    const odd = `<Sheet title="Odd"><Marquee /><Script>{\`${CLOCK}\`}</Script></Sheet>`
    const sheet = createSheet(ws, { title: 'Odd', source: odd }, { body: 'Odd', refs: [] })
    liftScriptsIntoCode(ws)
    expect(getSheet(ws, sheet.id)?.source).toBe(odd)
    expect(getAppMeta(ws, 'scripts_as_code')).toBeNull()
  })

  test('a page without Scripts is left as it was, and the lift runs once', () => {
    const plain = '<Sheet title="Plain"><Text>hi</Text></Sheet>'
    const sheet = createSheet(ws, { title: 'Plain', source: plain }, { body: 'hi', refs: [] })
    liftScriptsIntoCode(ws)
    expect(getSheet(ws, sheet.id)?.source).toBe(plain)
    const later = createSheet(ws, { title: 'Later', source: OLD }, { body: 'Lab', refs: [] })
    liftScriptsIntoCode(ws)
    expect(getSheet(ws, later.id)?.source).toBe(OLD)
  })
})
