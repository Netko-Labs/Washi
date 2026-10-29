import { describe, expect, test } from 'bun:test'
import { paperRegistry } from '@washi/paper/registry'
import { parse, serialize, validate } from '@washi/wsx'
import { moveBlock } from '../lib/columns'
import { newBlock, toBlocks, toSheet } from '../lib/convert'
import { flatten, isColumns, isTabs, locate, tidy } from '../lib/slots'
import { newTabs, withNewTab, withoutTab, withTabLabel, withTabMoved } from '../lib/tabs'
import type { Block, TabsBlock } from '../lib/types'
import { slashMatches } from '../lib/utils'

const SOURCE = `<Sheet title="Handbook" wsx="1">
  <Title>Onboarding</Title>
  <Tabs state="section" labels={['Week one', 'Tools']}>
    <Tab><Text>Meet the team</Text><List marker="check"><Item done>laptop</Item><Item>badge</Item></List></Tab>
    <Tab><Database table="tools" /><Columns><Column><Text>a</Text></Column><Column><Text>b</Text></Column></Columns></Tab>
  </Tabs>
</Sheet>`

const ROOT = parse('<Sheet title="T" wsx="1"></Sheet>')
const textOf = (block: Block | undefined) => (block && 'text' in block ? block.text : null)
const strip = (blocks: Block[]) => blocks.find(isTabs) as TabsBlock
const labels = (blocks: Block[]) => strip(blocks).tabs.map((tab) => tab.label)
const saved = (blocks: Block[]) => toSheet(ROOT, blocks)

describe('tabs in the editor', () => {
  test('a Washi-written Tabs page edits in place and saves back byte for byte', () => {
    const blocks = toBlocks(parse(SOURCE))
    const tabs = strip(blocks)
    expect(tabs.tabs.map((tab) => tab.label)).toEqual(['Week one', 'Tools'])
    expect(tabs.tabs[0]?.blocks.map(textOf)).toEqual(['Meet the team', 'laptop', 'badge'])
    expect(tabs.tabs[1]?.blocks.map((block) => block.kind)).toEqual(['locked', 'locked'])
    const page = toSheet(parse(SOURCE), blocks)
    expect(validate(page, paperRegistry)).toEqual([])
    expect(serialize(page)).toBe(serialize(parse(SOURCE)))
  })

  test('an edit in one tab leaves the rest of the page as it was', () => {
    const blocks = toBlocks(parse(SOURCE))
    const first = strip(blocks).tabs[0]?.blocks[0]
    const edited = blocks.map((block) =>
      isTabs(block) && first
        ? {
            ...block,
            tabs: block.tabs.map((tab, at) =>
              at === 0
                ? { ...tab, blocks: [{ ...first, text: 'Meet everyone' }, ...tab.blocks.slice(1)] }
                : tab,
            ),
          }
        : block,
    )
    const before = serialize(parse(SOURCE)).split('\n')
    const after = serialize(toSheet(parse(SOURCE), edited)).split('\n')
    const changed = after.filter((line, at) => line !== before[at])
    expect(changed).toEqual(['      <Text>Meet everyone</Text>'])
  })

  test('/tabs makes two tabs of an empty line each, and a valid page', () => {
    const made = newTabs()
    expect(made.tabs.map((tab) => tab.label)).toEqual(['Tab 1', 'Tab 2'])
    expect(made.tabs.map((tab) => tab.blocks.map(textOf))).toEqual([[''], ['']])
    const page = saved([made])
    expect(validate(page, paperRegistry)).toEqual([])
    expect(serialize(page)).toContain(`<Tabs labels={["Tab 1","Tab 2"]}>`)
    expect(slashMatches('tabs', [])[0]?.label).toBe('Tabs')
    expect(slashMatches('tabs', [], [], true).some((option) => option.label === 'Tabs')).toBe(false)
  })

  test('a tab is added, renamed and moved; labels follow the tabs', () => {
    const made = newTabs()
    const added = withNewTab([made], made.id)
    if (!added) throw new Error('no tab added')
    expect(labels(added.blocks)).toEqual(['Tab 1', 'Tab 2', 'Tab 3'])
    const renamed = withTabLabel(added.blocks, made.id, added.tab.id, '  Notes  ')
    expect(labels(renamed)).toEqual(['Tab 1', 'Tab 2', 'Notes'])
    expect(withTabLabel(renamed, made.id, added.tab.id, '   ')).toBe(renamed)
    const moved = withTabMoved(renamed, made.id, added.tab.id, -1)
    expect(labels(moved)).toEqual(['Tab 1', 'Notes', 'Tab 2'])
    expect(serialize(saved(moved))).toContain(`labels={["Tab 1","Notes","Tab 2"]}`)
  })

  test('a strip holds twelve tabs at most', () => {
    let blocks: Block[] = [newTabs()]
    const id = strip(blocks).id
    for (let n = 0; n < 10; n++) blocks = withNewTab(blocks, id)?.blocks ?? blocks
    expect(strip(blocks).tabs).toHaveLength(12)
    expect(withNewTab(blocks, id)).toBeNull()
  })

  test('a tab removed takes its blocks; the last one left unwraps into the page', () => {
    const blocks = toBlocks(parse(SOURCE))
    const tabs = strip(blocks)
    const [week, tools] = tabs.tabs
    if (!week || !tools) throw new Error('two tabs expected')
    const left = tidy(withoutTab(blocks, tabs.id, tools.id))
    expect(left.some(isTabs)).toBe(false)
    expect(left.map(textOf)).toEqual(['Onboarding', 'Meet the team', 'laptop', 'badge'])
  })

  test('a block moves from one tab to another; an emptied tab keeps a line', () => {
    const made = newTabs()
    const [one, two] = made.tabs
    if (!one || !two) throw new Error('two tabs expected')
    const a = newBlock('text', 'a')
    const blocks: Block[] = [{ ...made, tabs: [{ ...one, blocks: [a] }, two] }]
    const target = two.blocks[0]?.id ?? ''
    const moved = moveBlock(blocks, a.id, target, 'after')
    const [first, second] = strip(moved).tabs
    expect(second?.blocks.map(textOf)).toEqual(['', 'a'])
    expect(first?.blocks.map(textOf)).toEqual([''])
    expect(locate(moved, a.id)?.slotId).toBe(two.id)
  })

  test('tabs never nest, in columns or in themselves', () => {
    const [a, b] = [newBlock('text', 'a'), newBlock('text', 'b')]
    const made = newTabs()
    const inner = made.tabs[0]?.blocks[0]?.id ?? ''
    const page: Block[] = [a, made, b]
    expect(moveBlock(page, made.id, a.id, 'right').some(isColumns)).toBe(false)
    expect(moveBlock(page, a.id, made.id, 'right').some(isColumns)).toBe(false)
    const columns = moveBlock(page, b.id, a.id, 'right')
    const cell = columns.find(isColumns)?.columns[0]?.blocks[0]?.id ?? ''
    expect(moveBlock(columns, made.id, cell, 'after')).toBe(columns)
    expect(moveBlock(columns, columns.find(isColumns)?.id ?? '', inner, 'after')).toBe(columns)
    const side = moveBlock(page, b.id, inner, 'right')
    expect(strip(side).tabs[0]?.blocks.map(textOf)).toEqual(['', 'b'])
  })

  test('the arrows walk only the tab on screen', () => {
    const made = newTabs()
    const [one, two] = made.tabs
    const order = flatten([made], { [made.id]: two?.id ?? '' })
    expect(order.map((block) => block.id)).toEqual(two?.blocks.map((block) => block.id) ?? [])
    expect(flatten([made], {}).map((block) => block.id)).toEqual(
      one?.blocks.map((block) => block.id) ?? [],
    )
  })

  test('a Tabs with one tab, or labels that miss a tab, stays whole', () => {
    const one = parse(
      `<Sheet wsx="1"><Tabs labels={['Only']}><Tab><Text>x</Text></Tab></Tabs></Sheet>`,
    )
    expect(toBlocks(one).map((block) => block.kind)).toEqual(['locked'])
    const short = parse(
      `<Sheet wsx="1"><Tabs labels={['A']}><Tab><Text>x</Text></Tab><Tab><Text>y</Text></Tab></Tabs></Sheet>`,
    )
    expect(toBlocks(short).map((block) => block.kind)).toEqual(['locked'])
  })
})
