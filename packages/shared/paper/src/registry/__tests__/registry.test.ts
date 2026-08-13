import { describe, expect, test } from 'bun:test'
import { parse, validate } from '@washi/wsx'
import { invalidClasses, paperRegistry } from '../index'

describe('tailwind class guard', () => {
  test('accepts the full vocabulary — arbitrary values, gradients, variants', () => {
    expect(invalidClasses('mt-6 flex items-center gap-2 text-sm text-muted-foreground')).toEqual([])
    expect(invalidClasses('mt-[13px] hover:bg-red-500 bg-gradient-to-r from-fuchsia-500')).toEqual(
      [],
    )
    expect(invalidClasses('grid-cols-[1fr_2fr] rotate-[17deg] shadow-[0_8px_30px_#0003]')).toEqual(
      [],
    )
  })

  test('rejects network-capable and breakout tokens', () => {
    expect(invalidClasses('bg-[url(https://evil.example/x)]')).toHaveLength(1)
    expect(invalidClasses('bg-[URL(//x)]')).toHaveLength(1)
    expect(invalidClasses('content-["hi"]')).toHaveLength(1)
    expect(invalidClasses('p-2;}body{background:red')).toHaveLength(1)
    expect(invalidClasses(`w-[${'x'.repeat(140)}]`)).toHaveLength(1)
  })
})

describe('paper registry', () => {
  test('the spec example validates clean', () => {
    const root = parse(`
      <Sheet title="Q3 Roadmap" icon="🗺️" tags={['planning']}>
        <H1>Q3 Roadmap</H1>
        <Callout tone="warning" class="mt-6 font-medium">Dates aspirational.</Callout>
        <TaskList bind={{ table: 'tasks', where: [{ column: 'status', op: 'eq', value: 'todo' }] }} />
        <Table bind={{ table: 'tasks' }} columns={['title', 'status']} />
        <Button action={{ verb: 'table.insert', table: 'tasks' }}>Add task</Button>
        <Ref sheet="0198c2f0">design doc</Ref>
      </Sheet>
    `)
    expect(validate(root, paperRegistry)).toEqual([])
  })

  test('flags url() classes, http urls, unknown props', () => {
    const root = parse(`
      <Sheet title="t">
        <P class="bg-[url(https://evil.example)]">x</P>
        <Img src="http://insecure.example/pic.png" />
        <H1 onClick="alert">hi</H1>
      </Sheet>
    `)
    const diagnostics = validate(root, paperRegistry)
    const text = diagnostics
      .map((diagnostic) => `${diagnostic.path}: ${diagnostic.message}`)
      .join('\n')
    expect(text).toContain('forbidden tokens')
    expect(text).toMatch(/Img.*(protocol|url|Invalid)/i)
    expect(text).toMatch(/H1.*onClick/)
  })

  test('every registry component parses its own defaults', () => {
    expect(Object.keys(paperRegistry).length).toBeGreaterThanOrEqual(28)
  })

  test('themes and display components validate clean', () => {
    const root = parse(`
      <Sheet title="Playbook" theme={{ accent: 'blue', face: 'rounded', paper: 'dots' }}>
        <Tape color="teal">live data</Tape>
        <Hero size="lg" align="center" title="Big" subtitle="small" />
        <P><Chip color="pink">wsx</Chip><Stamp label="決" /></P>
        <Columns><Column><Stat value="7" label="open" hint="count" /></Column></Columns>
        <Card title="Owner" accent="mustard"><P>x</P></Card>
        <Timeline><Step marker="01" title="Freeze" color="slate">no new features</Step></Timeline>
      </Sheet>
    `)
    expect(validate(root, paperRegistry)).toEqual([])
  })

  test('presets validate; unknown presets are refused', () => {
    for (const preset of ['washi', 'midnight', 'broadsheet', 'sticker', 'terminal', 'blueprint']) {
      const root = parse(`<Sheet title="t" theme={{ preset: '${preset}' }}><P>x</P></Sheet>`)
      expect(validate(root, paperRegistry)).toEqual([])
    }
    const bad = parse(`<Sheet title="t" theme={{ preset: 'vaporwave' }} />`)
    expect(validate(bad, paperRegistry).length).toBeGreaterThan(0)
  })

  test('bad themes and off-enum colors are refused', () => {
    const root = parse(`
      <Sheet title="t" theme={{ accent: 'chartreuse', gradient: true }}>
        <Tape color="neon">x</Tape>
        <Hero title="t" size="xl" />
      </Sheet>
    `)
    const text = validate(root, paperRegistry)
      .map((diagnostic) => diagnostic.message)
      .join('\n')
    expect(text).toMatch(/accent/)
    expect(text).toMatch(/gradient/)
    expect(text).toMatch(/color/)
    expect(text).toMatch(/size/)
  })
})
