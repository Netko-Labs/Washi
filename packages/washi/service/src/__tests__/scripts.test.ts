import { describe, expect, test } from 'bun:test'
import { compileScript } from '../scripts/compile'
import { checkSource } from '../sheets/service'

describe('compiling a script', () => {
  test('TSX becomes h() calls against registry names', () => {
    const compiled = compileScript(
      'function view(): unknown { const [n] = useState("n", 0); return <Card title="x"><Text>{n}</Text></Card> }',
    )
    expect(compiled.ok && compiled.js).toContain('h(Card')
  })

  test('nothing imported, nothing exported, and a view to draw', () => {
    expect(compileScript('import x from "y"\nfunction view() { return null }')).toMatchObject({
      ok: false,
      error: expect.stringContaining('imports nothing'),
    })
    expect(compileScript('export function view() { return null }')).toMatchObject({
      ok: false,
      error: expect.stringContaining('exports nothing'),
    })
    expect(compileScript('const a = 1')).toMatchObject({
      ok: false,
      error: expect.stringContaining('function view()'),
    })
  })

  test('a page whose automation will not compile is refused before it is saved', () => {
    const good = checkSource(
      '<Sheet title="t"><Automation table="t" on="insert">{`function run(event) { act({}) }`}</Automation></Sheet>',
    )
    expect(good.ok).toBe(true)
    const broken = checkSource(
      '<Sheet title="t"><Automation table="t" on="insert">{`function run(event) { act({ }`}</Automation></Sheet>',
    )
    expect(broken.ok).toBe(false)
    expect(broken.diagnostics[0]?.message).toContain('script:')
  })
})

describe('a page that runs, at save (D100)', () => {
  test('code that compiles and imports what a page may is kept; anything else is refused', () => {
    expect(
      checkSource(
        "import { useRows } from 'washi'\nconst n = useRows({ table: 't' }).length\n<Sheet title=\"t\"><Text>{n}</Text></Sheet>",
      ).ok,
    ).toBe(true)
    const net = checkSource('import { get } from \'node:https\'\n<Sheet title="t" />')
    expect(net.diagnostics.map((each) => each.message).join()).toContain('cannot import')
    expect(checkSource('<Sheet title="t"><Stat valu={1 + 1} /></Sheet>').ok).toBe(false)
  })
})
