import { describe, expect, test } from 'bun:test'
import { z } from 'zod'
import { domDiagnostics, pageModule, parse, validate, type WsxRegistry } from '../index'

const CLOCK = `import { useNow } from 'washi'

function Clock({ size = 40 }) {
  const now = useNow()
  return <div style={{ font: \`600 \${size}px system-ui\` }}>{new Date(now).toLocaleTimeString()}</div>
}
`

const WORDS = 'A widget is JSX now'
const registry: WsxRegistry = {
  components: {
    Sheet: { props: z.strictObject({ title: z.string() }), children: 'nodes' },
    Text: { props: z.strictObject({}), children: 'text' },
    Widget: {
      props: z.strictObject({ title: z.string().optional() }),
      children: 'component',
      childWords: WORDS,
    },
  },
}

const errors = (source: string) =>
  validate(parse(source), registry)
    .filter((each) => each.severity === 'error')
    .map((each) => each.message)

describe('a widget is JSX (D113)', () => {
  test('one of the page’s own components is its child; a primitive is refused', () => {
    expect(errors(`${CLOCK}\n<Sheet title="t"><Widget><Clock /></Widget></Sheet>`)).toEqual([])
    expect(errors(`${CLOCK}\n<Sheet title="t"><Widget><Text>hi</Text></Widget></Sheet>`)).toEqual([
      WORDS,
    ])
    expect(errors(`${CLOCK}\n<Sheet title="t"><Widget /></Sheet>`)).toEqual([WORDS])
    expect(
      errors(`${CLOCK}\n<Sheet title="t"><Widget><Clock /><Clock /></Widget></Sheet>`),
    ).toEqual([WORDS])
  })

  test('an old widget’s HTML is a warning, so its page still saves', () => {
    const said = validate(
      parse('<Sheet title="t"><Widget>{`<div></div>`}</Widget></Sheet>'),
      registry,
    )
    expect(said.map((each) => [each.severity, each.message])).toEqual([['warning', WORDS]])
  })

  test('the page never calls a widget’s component: it draws as a node, props evaluated', () => {
    const module = pageModule(
      `${CLOCK}\nconst big = 2\n<Sheet title="t"><Widget title="c"><Clock size={big * 20} label="x" on /></Widget></Sheet>`,
    )
    expect(module).toContain(
      '<Widget title="c">{{ name: "Clock", props: { "size": (big * 20), "label": "x", "on": true }, children: [] }}</Widget>',
    )
    expect(module).not.toContain('<Clock')
  })

  test('the DOM is a widget’s alone: its component, what it uses, or an export', () => {
    const page = (code: string, markup = '<Widget><Clock /></Widget>') =>
      domDiagnostics(parse(`${code}\n<Sheet title="t">${markup}</Sheet>`)).map(
        (each) => /^<(\w+)> is the DOM/.exec(each.message)?.[1],
      )
    expect(page(CLOCK)).toEqual([])
    expect(
      page(`${CLOCK}\nconst face = () => <span />\nfunction Wrap() { return face() }`),
    ).toEqual(['span'])
    expect(
      page('const face = () => <span />\nfunction Clock() { return <div>{face()}</div> }'),
    ).toEqual([])
    expect(page('export function Dial() { return <svg><circle r={2} /></svg> }', '')).toEqual([])
    expect(page(CLOCK, '<Text>no widget</Text>')).toEqual(['div'])
    expect(page(`${CLOCK}\nconst x = <b>bold</b>`)).toEqual(['b'])
  })
})
