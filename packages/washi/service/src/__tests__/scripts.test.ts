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

  test('a page whose script will not compile is refused before it is saved', () => {
    const good = checkSource(
      '<Sheet title="t"><Script>{`function view() { return <Text>hi</Text> }`}</Script></Sheet>',
    )
    expect(good.ok).toBe(true)
    const broken = checkSource(
      '<Sheet title="t"><Script>{`function view() { return <Text>hi }`}</Script></Sheet>',
    )
    expect(broken.ok).toBe(false)
    expect(broken.diagnostics[0]?.message).toContain('script:')
  })
})

describe('a page that runs, before it can (D100)', () => {
  test('code in a page is refused at save, in words', () => {
    const check = checkSource('const n = 1\n<Sheet title="t"><Text>{n}</Text></Sheet>')
    expect(check.ok).toBe(false)
    expect(check.diagnostics.map((each) => each.message).join()).toContain('not accepted yet')
    expect(checkSource('<Sheet title="t"><Text>hi</Text></Sheet>').ok).toBe(true)
  })
})
