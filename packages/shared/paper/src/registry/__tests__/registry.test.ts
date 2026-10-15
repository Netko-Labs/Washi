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
        <Row><Tape>live</Tape><Stamp label="決" /><Chip tone="success">ready</Chip><Mascot mood="wink" /></Row>
        <Missing kind="Matrix" reason="habit grid over 28 days" />
      </Sheet>`),
    ).toBe('')
  })

  test('what the registry refuses: Box, Span, H1, emoji icons, http figures, nested Repeat, two mascots', () => {
    const text = messages(`
      <Sheet title="t" icon="🗺️">
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
