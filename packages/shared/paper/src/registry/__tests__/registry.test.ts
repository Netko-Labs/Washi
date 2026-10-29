import { describe, expect, test } from 'bun:test'
import { hasErrors, parse, validate } from '@washi/wsx'
import { classProblems, PRIMITIVE_GROUPS, paperRegistry } from '../index'

const messages = (source: string) =>
  validate(parse(source), paperRegistry)
    .map((diagnostic) => `${diagnostic.path}: ${diagnostic.message}`)
    .join('\n')

describe('the styling surface', () => {
  test('layout tokens pass; colour, type, radius and margins name the prop to use instead', () => {
    expect(classProblems('row items-center gap-tight @md:grid-3 grow')).toEqual([])
    expect(classProblems('bg-red-500')[0]).toMatch(/colour.*use tone/)
    expect(classProblems('text-xl')[0]).toMatch(/type.*size or emphasis/)
    expect(classProblems('rounded-xl')[0]).toMatch(/variant/)
    expect(classProblems('mt-6')[0]).toMatch(/rhythm.*Section, Stack or gap/)
    expect(classProblems('md:flex')[0]).toMatch(/@sm: @md: @lg:/)
    expect(classProblems('w-[720px]')[0]).toMatch(/measure/)
    expect(classProblems('grid-cols-[1fr_2fr]')[0]).toMatch(/arbitrary/)
  })

  test('the four enums are accepted everywhere; off-enum values list the legal ones', () => {
    expect(
      messages(
        `<Sheet title="t"><Card variant="raised" tone="info" size="lg" emphasis="strong" span={6}><Text>x</Text></Card></Sheet>`,
      ),
    ).toBe('')
    const text = messages(`<Sheet title="t"><Card tone="purple"><Text>x</Text></Card></Sheet>`)
    expect(text).toContain(
      'Sheet > Card: prop tone: "purple" is not one of neutral · accent · info',
    )
  })

  test('a hex, a style prop or a handler is refused with the alternative named', () => {
    const text = messages(
      `<Sheet title="t"><Text color="#ff0000" style="x" onClick="go">x</Text></Sheet>`,
    )
    expect(text).toContain('prop color is not addressable on <Text> — use tone')
    expect(text).toContain('prop style is not addressable on <Text>')
    expect(text).toContain(
      'prop onClick is not addressable on <Text> — interaction is a prop, not a handler',
    )
  })

  test('only wide blocks take width; the rest are told which do', () => {
    expect(
      messages(
        `<Sheet title="t"><Board bind={{ table: 'tasks' }} groupBy="status" width="full" /><Agenda bind={{ table: 'tasks' }} date="due" width="wide" /><Grid width="page"><Text>x</Text></Grid></Sheet>`,
      ),
    ).toBe('')
    expect(messages(`<Sheet title="t"><Text width="full">x</Text></Sheet>`)).toContain(
      'only wide blocks take width',
    )
    expect(
      messages(
        `<Sheet title="t"><Board bind={{ table: 'tasks' }} groupBy="status" width="huge" /></Sheet>`,
      ),
    ).toContain('page · wide · full')
  })

  test('the Sheet has no class and never pins the mode', () => {
    const text = messages(`<Sheet title="t" class="p-4" mood="dark"><Text>x</Text></Sheet>`)
    expect(text).toContain('prop class is not addressable on <Sheet> — the Sheet owns measure')
    expect(text).toContain('mood')
  })
})

describe('the registry', () => {
  test('the five reference-app shapes validate clean', () => {
    expect(
      messages(`
      <Sheet title="Board" icon="kanban" feel="board" theme="aizome" state={{ local: { tab: 'board' }, stored: { mine: false } }} wsx="1">
        <Hero title="Sprint 12" subtitle="Two weeks" />
        <Row>
          <Stat label="open" expr="count(tasks where status = 'open')" />
          <Stat label="points" expr="sum(tasks.points)" trend="up" />
        </Row>
        <Board bind={{ table: 'tasks' }} groupBy="status" />
        <Repeat bind={{ table: 'tasks' }}>
          <Card title="$row.title"><Task row="$row.id">$row.title</Task><Field field="points" kind="number" table="tasks" row="$row.id" /></Card>
        </Repeat>
        <Section title="Money"><Money expr="sum(tasks.points) * 12.5" currency="EUR" /></Section>
        <Show expr="mine = true"><Callout tone="success" title="Yours">Only your rows.</Callout></Show>
        <Tabs labels={['board', 'list']} state="tab"><Tab><Text>a</Text></Tab><Tab><Text>b</Text></Tab></Tabs>
        <Timeline><Step marker="01" title="Freeze">no new features</Step></Timeline>
        <Chart bind={{ table: 'tasks', groupBy: { column: 'status', aggregates: [{ fn: 'count' }] } }} kind="donut" />
        <List marker="check"><Item done>shipped</Item><Item>next</Item></List>
        <Text>See <Ref sheet="0198">the brief</Ref>, press <Kbd>⌘K</Kbd>, <Mark>note this</Mark> <Tag>wsx</Tag></Text>
        <Note>Footnote one.</Note><Source>Handoff 0.4</Source>
        <Row><Chip tone="success">ready</Chip><Mascot mood="wink" /></Row>
        <Missing kind="Matrix" reason="habit grid over 28 days" />
      </Sheet>`),
    ).toBe('')
  })

  test('what the registry refuses: Box, Span, H1, made-up icons, http figures, nested Repeat, two mascots', () => {
    const text = messages(`
      <Sheet title="t" icon="map-pin-ish">
        <Box><Span>x</Span></Box>
        <H1>hi</H1>
        <Figure src="http://x.example/a.png" alt="a" />
        <Repeat bind={{ table: 't' }}><Repeat bind={{ table: 't' }}><Text>x</Text></Repeat></Repeat>
        <Mascot /><Mascot />
        <Item>orphan</Item>
      </Sheet>`)
    expect(text).toContain('<Box> is not a registry primitive — write <Missing kind="Box"')
    expect(text).toContain('<H1> is not a registry primitive')
    expect(text).toMatch(/Sheet: prop icon/)
    expect(text).toMatch(/Figure.*(protocol|url|Invalid)/i)
    expect(text).toContain('<Repeat> cannot contain another <Repeat>')
    expect(text).toContain('<Mascot> may appear once per sheet')
    expect(text).toContain('<Item> is only legal inside <List>')
  })

  test('the complexity budget is a warning, not an error', () => {
    const many = Array.from({ length: 401 }, () => '<Text>x</Text>').join('')
    const diagnostics = validate(parse(`<Sheet title="t">${many}</Sheet>`), paperRegistry)
    expect(hasErrors(diagnostics)).toBe(false)
    expect(diagnostics[0]?.severity).toBe('warning')
    expect(diagnostics[0]?.message).toContain('402 nodes (budget 400)')
  })

  test('every primitive is in exactly one group', () => {
    const grouped = Object.values(PRIMITIVE_GROUPS).flat()
    expect(new Set(grouped).size).toBe(grouped.length)
    expect(grouped.sort()).toEqual(Object.keys(paperRegistry.components).sort())
    expect(grouped.length).toBeGreaterThanOrEqual(44)
  })
})

describe('the team week', () => {
  test('a Chart draws now (bind) or over time (history), never both or neither', () => {
    const chart = (props: string) =>
      messages(`<Sheet title="t"><Chart kind="area" ${props} /></Sheet>`)
    expect(chart(`history={{ table: 'issues', range: '30d' }}`)).toBe('')
    expect(chart(`bind={{ table: 'issues' }}`)).toBe('')
    expect(chart('')).toMatch(/exactly one/)
    expect(chart(`bind={{ table: 'issues' }} history={{ table: 'issues' }}`)).toMatch(/exactly one/)
  })

  test('a Database names its table and may name its views', () => {
    expect(messages(`<Sheet title="t"><Database table="issues" /></Sheet>`)).toBe('')
    expect(
      messages(
        `<Sheet title="t"><Database table="issues" views={[{ name: 'Mine', kind: 'board', groupBy: 'state' }]} /></Sheet>`,
      ),
    ).toBe('')
    expect(
      messages(
        `<Sheet title="t"><Database table="issues" views={[{ name: 'x', kind: 'gantt' }]} /></Sheet>`,
      ),
    ).not.toBe('')
  })
})

describe('the page theme', () => {
  test('a registry id or a workspace key; anything else names both', () => {
    expect(messages(`<Sheet title="t" theme="nord"><Text>x</Text></Sheet>`)).toBe('')
    expect(messages(`<Sheet title="t" theme="ws:our-sumi"><Text>x</Text></Sheet>`)).toBe('')
    expect(messages(`<Sheet title="t" theme="neon"><Text>x</Text></Sheet>`)).toMatch(
      /washi · sumi.*ws:<name>/,
    )
  })
})

describe('layout', () => {
  test('columns hold columns, a bento holds tiles, each only inside its own', () => {
    expect(
      messages(
        `<Sheet title="t"><Columns width="wide"><Column ratio={2}><Text>a</Text></Column><Column><Text>b</Text></Column></Columns><Bento columns={3}><Tile shape="big" title="x"><Text>c</Text></Tile><Tile shape="banner"><Text>d</Text></Tile></Bento></Sheet>`,
      ),
    ).toBe('')
    const text = messages(
      `<Sheet title="t"><Column><Text>a</Text></Column><Tile><Text>b</Text></Tile><Bento><Tile shape="huge"><Text>c</Text></Tile></Bento><Columns><Column ratio={9}><Text>d</Text></Column></Columns></Sheet>`,
    )
    expect(text).toContain('<Column> is only legal inside <Columns>')
    expect(text).toContain('<Tile> is only legal inside <Bento>')
    expect(text).toContain('square · wide · tall · big · banner')
    expect(text).toMatch(/ratio/)
  })
})

describe('the sandbox names', () => {
  test('no primitive shadows a JavaScript global a script runs on', () => {
    const globals = [
      'Object',
      'Function',
      'Array',
      'Error',
      'Number',
      'Boolean',
      'String',
      'Symbol',
      'Math',
      'JSON',
      'Date',
      'RegExp',
      'Promise',
      'Proxy',
      'Reflect',
      'Map',
      'Set',
      'WeakMap',
      'WeakSet',
      'BigInt',
      'Intl',
      'Iterator',
    ]
    expect(Object.keys(paperRegistry.components).filter((name) => globals.includes(name))).toEqual(
      [],
    )
  })

  test('a formula function takes a plain name, never a built-in one', () => {
    const page = (name: string) =>
      messages(
        `<Sheet title="t"><Formula name="${name}">{\`function ${name}(x) { return x }\`}</Formula></Sheet>`,
      )
    expect(page('with_tax')).toBe('')
    expect(page('sum')).toContain('built-in')
    expect(page('Tax')).toContain('lowercase')
  })
})

describe('Stat currency', () => {
  test('a three-letter code passes; anything else is refused in words', () => {
    const spec = paperRegistry.components.Stat
    expect(spec?.props.safeParse({ label: 'Unbilled', value: 150, currency: 'USD' }).success).toBe(
      true,
    )
    const wrong = spec?.props.safeParse({ label: 'Unbilled', value: 150, currency: 'dollars' })
    expect(wrong?.success).toBe(false)
    expect(JSON.stringify(wrong?.error?.issues)).toContain('three-letter currency code')
  })
})
