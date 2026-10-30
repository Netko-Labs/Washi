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
    Button: {
      props: z.strictObject({ label: z.string(), action: z.object({ verb: z.string() }) }),
      children: 'none',
    },
    Press: { props: z.strictObject({ action: z.object({ verb: z.string() }) }), children: 'text' },
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

  test('a handler stands in for the action it becomes', () => {
    expect(
      validate(parse('<Sheet title="t"><Press onPress={() => go()}>Go</Press></Sheet>'), registry),
    ).toEqual([])
    const bare = validate(parse('<Sheet title="t"><Press>Go</Press></Sheet>'), registry)
    expect(bare.map((each) => each.message).join()).toContain('action')
    const text = validate(
      parse('<Sheet title="t"><Title onPress={() => go()}>Go</Title></Sheet>'),
      registry,
    )
    expect(text.map((each) => each.message)).toEqual([
      '<Title> takes no press — put onPress on a <Button>',
    ])
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

  test('a plain constant sits beside the helper that reads it; one that acts or reads view() stays', () => {
    const module = pageModule(`import { useNow } from 'washi'
const H = 20
const ROWS = Array.from({ length: H })
const fill = (y) => y < H
const now = useNow()
const t = now / 1000
const late = () => now > 0
let count = 0
function frame() { return H }
<Sheet title="t"><Text>{frame(t)}</Text></Sheet>`)
    const view = module.indexOf('export default function view() {')
    expect(module.indexOf('const H = 20')).toBeLessThan(view)
    expect(module.indexOf('const fill = (y) => y < H')).toBeLessThan(view)
    for (const stays of [
      'const ROWS',
      'const now = useNow()',
      'const t = now',
      'const late',
      'let count',
    ]) {
      expect(module.indexOf(stays)).toBeGreaterThan(view)
    }
  })

  test('a name a hook hands out by destructuring stays in view(), and so does what reads it', () => {
    const module = pageModule(`import { usePageState, useRows } from 'washi'
const [wCost, setCost] = usePageState('w_cost', 3)
const { rows: [first = null, ...rest] } = { rows: useRows({ table: 't' }) }
const { a, b: { c } } = { a: 1, b: { c: 2 } }
const weights = { cost: wCost }
const head = first
const tail = rest.length
const both = a + c
<Sheet title="t"><Text>{weights.cost}</Text></Sheet>`)
    const view = module.indexOf('export default function view() {')
    for (const stays of ['const [wCost', 'const weights', 'const head', 'const tail']) {
      expect(module.indexOf(stays)).toBeGreaterThan(view)
    }
    expect(module.indexOf('const { a, b')).toBeLessThan(view)
    expect(module.indexOf('const both')).toBeLessThan(view)
  })

  test('a computed constant a component reads moves up with it; one reaching a hook never', () => {
    const module = pageModule(`import { useNow, act as press } from 'washi'
const COLS = 'ABCDEFGH'.split('')
const ROWS = Array.from({ length: COLS.length }, (_, i) => i)
const today = new Date()
const ticks = useTicks()
const pressed = press({ verb: 'x' })
function useTicks() { return useNow() }
function Board() { return <Text>{COLS.join('') + ROWS.length + ticks + pressed}</Text> }
<Sheet title="t"><Board /><Text>{today}</Text></Sheet>`)
    const view = module.indexOf('export default function view() {')
    expect(module.indexOf('const COLS')).toBeLessThan(view)
    expect(module.indexOf('const ROWS')).toBeLessThan(view)
    for (const stays of ['const today', 'const ticks', 'const pressed']) {
      expect(module.indexOf(stays)).toBeGreaterThan(view)
    }
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

  test('code ending in a line comment keeps the tag after it', () => {
    const root = parse(
      '<Sheet title="t"><Text>{n // the count\n}</Text><Stat label="a" value={n // why\n} /></Sheet>',
    )
    expect(parse(serialize(root))).toEqual(root)
    expect(serialize(root)).toContain('</Text>')
  })

  test('a line break beside code is no space, as in JSX', () => {
    const root = parse('<Sheet title="t"><Text>\n  Total\n  {n}\n</Text></Sheet>')
    expect(root.children[0]).toMatchObject({ children: [{ value: 'Total' }, { source: 'n' }] })
  })
})

describe('prose with inline elements', () => {
  test('keeps its spaces, and writes back on one line', () => {
    const root = parse(
      '<Sheet title="t"><Text>Read <Ref sheet="a">How we work</Ref> first, then <Mark>ship</Mark>.</Text></Sheet>',
    )
    expect(root.children[0]).toMatchObject({
      children: [
        { value: 'Read ' },
        { name: 'Ref' },
        { value: ' first, then ' },
        { name: 'Mark' },
        { value: '.' },
      ],
    })
    expect(serialize(root)).toContain(
      '<Text>Read <Ref sheet="a">How we work</Ref> first, then <Mark>ship</Mark>.</Text>',
    )
    expect(parse(serialize(root))).toEqual(root)
  })

  test('blocks laid out on their own lines gain no spaces', () => {
    const root = parse('<Sheet title="t">\n  <Title>A</Title>\n  <Text>B</Text>\n</Sheet>')
    expect(root.children.map((child) => child.kind)).toEqual(['element', 'element'])
  })
})
