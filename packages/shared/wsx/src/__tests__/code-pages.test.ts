import { describe, expect, test } from 'bun:test'
import { z } from 'zod'
import {
  hasCode,
  pageModule,
  parse,
  serialize,
  validate,
  WsxParseError,
  type WsxRegistry,
} from '../index'

const PAGE = `import { useRows } from 'washi'
import { format } from 'date-fns'

function Kpi({ label, value }: { label: string; value: number }) {
  return <Stat label={label} value={value} />
}

const open = useRows({ table: 'tasks' })

<Sheet title="Tasks">
  <Title>Open</Title>
  <Kpi label="open" value={open.length} />
  {open.map((task) => <Text key={task.id}>{task.title}</Text>)}
  <Button label="Done" onPress={() => act({ verb: 'table.update' })} />
  <Text>{format(new Date(), 'MMM d')}</Text>
</Sheet>`

const registry: WsxRegistry = {
  components: {
    Sheet: { props: z.strictObject({ title: z.string() }), children: 'nodes' },
    Title: { props: z.strictObject({}), children: 'text' },
    Text: { props: z.strictObject({}), children: 'text' },
    Stat: { props: z.strictObject({ label: z.string(), value: z.number() }), children: 'none' },
    Button: { props: z.strictObject({ label: z.string() }), children: 'none' },
  },
}

describe('a page that runs (D100)', () => {
  test('its code is the prelude; its markup keeps literals as data and code as holes', () => {
    const root = parse(PAGE)
    expect(root.prelude?.source.startsWith("import { useRows } from 'washi'")).toBe(true)
    expect(root.prelude?.source.endsWith("useRows({ table: 'tasks' })")).toBe(true)
    expect(root.prelude?.components).toEqual(['Kpi'])
    expect(root.props).toEqual({ title: 'Tasks' })
    const [, kpi, list, button, text] = root.children
    expect(kpi).toMatchObject({
      name: 'Kpi',
      props: { label: 'open' },
      code: { value: 'open.length' },
    })
    expect(list).toEqual({
      kind: 'code',
      source: 'open.map((task) => <Text key={task.id}>{task.title}</Text>)',
    })
    expect(button).toMatchObject({ code: { onPress: "() => act({ verb: 'table.update' })" } })
    expect(text).toMatchObject({
      children: [{ kind: 'code', source: "format(new Date(), 'MMM d')" }],
    })
    expect(hasCode(root)).toBe(true)
  })

  test('it round-trips through serialize, code and all', () => {
    const root = parse(PAGE)
    expect(parse(serialize(root))).toEqual(root)
    expect(serialize(root).startsWith("import { useRows } from 'washi'")).toBe(true)
  })

  test('a page of literals is no program', () => {
    expect(hasCode(parse('<Sheet title="t"><Text>hi</Text></Sheet>'))).toBe(false)
  })

  test('validation checks code props by name, lets the page’s own components through', () => {
    expect(validate(parse(PAGE), registry)).toEqual([])
    const typo = parse('<Sheet title="t"><Stat label="a" valu={1 + 1} /></Sheet>')
    expect(
      validate(typo, registry)
        .map((each) => each.message)
        .join(),
    ).toContain('valu')
    const missing = parse('<Sheet title="t"><Stat value={n} /></Sheet>')
    expect(
      validate(missing, registry)
        .map((each) => each.message)
        .join(),
    ).toContain('label')
  })

  test('a literal key is no prop, and an empty prop is an error', () => {
    const keyed = validate(
      parse('<Sheet title="t"><Stat label="a" value={1} key="x" /></Sheet>'),
      registry,
    )
    expect(keyed.map((each) => each.message).join()).toContain('key')
    expect(
      validate(parse('<Sheet title="t"><Stat label="a" value={1} key={id} /></Sheet>'), registry),
    ).toEqual([])
    expect(() => parse('<Sheet title={} />')).toThrow(WsxParseError)
  })

  test('a <Sheet>’s own props stay literal, and a page never default-exports', () => {
    const coded = validate(parse('<Sheet title={name} />'), registry)
    expect(coded.map((each) => each.message).join()).toContain('literal')
    expect(() => parse('export default 1\n<Sheet title="t" />')).toThrow()
    expect(() => parse('<Sheet title="t" />\nconst after = 1')).toThrow()
  })
})

describe('a page as a module', () => {
  test('imports, functions and exports at the top; the rest runs in view()', () => {
    const module = pageModule(`import { useRows } from 'washi'
export function useOpen() { return useRows({ table: 'tasks' }) }
function Kpi() { return <Stat label="a" value={1} /> }
const open = useOpen()
<Sheet title="t"><Text>{open.length}</Text></Sheet>`)
    const view = module.indexOf('export default function view() {')
    expect(module.indexOf("import { useRows } from 'washi'")).toBeLessThan(view)
    expect(module.indexOf('export function useOpen()')).toBeLessThan(view)
    expect(module.indexOf('function Kpi()')).toBeLessThan(view)
    expect(module.indexOf('const open = useOpen()')).toBeGreaterThan(view)
    expect(module.trimEnd().endsWith('</Sheet>\n)\n}')).toBe(true)
  })
})

describe('text beside code', () => {
  test('keeps the space JSX keeps, and writes back on one line', () => {
    const root = parse('<Sheet title="t"><Title>Hello {name}!</Title><Text>{a} {b}</Text></Sheet>')
    const [title, text] = root.children
    expect(title).toMatchObject({
      children: [{ value: 'Hello ' }, { source: 'name' }, { value: '!' }],
    })
    expect(text).toMatchObject({ children: [{ source: 'a' }, { value: ' ' }, { source: 'b' }] })
    expect(serialize(root)).toContain('<Title>Hello {name}!</Title>')
    expect(serialize(root)).toContain('<Text>{a} {b}</Text>')
    expect(parse(serialize(root))).toEqual(root)
  })

  test('a line break beside code is no space, as in JSX', () => {
    const root = parse('<Sheet title="t"><Text>\n  Total\n  {n}\n</Text></Sheet>')
    expect(root.children[0]).toMatchObject({ children: [{ value: 'Total' }, { source: 'n' }] })
  })
})
