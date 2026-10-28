import { describe, expect, test } from 'bun:test'
import { paperRegistry } from '@washi/paper/registry'
import { hasErrors, parse, serialize, validate } from '@washi/wsx'
import { lockedBlock, newBlock, toBlocks, toSheet } from '../lib/convert'
import {
  applyShortcut,
  blockFrame,
  bookmarkNode,
  dataNode,
  galleryNode,
  slashMatches,
  titleOf,
  uploadNode,
} from '../lib/utils'

const SOURCE = `<Sheet title="Plan" feel="note">
  <Title>Plan</Title>
  <Text lead>Why we are doing this</Text>
  <List marker="check">
    <Item done>Book flights</Item>
    <Item>Pack</Item>
  </List>
  <Code lang="ts">{"const a = 1\\nconst b = 2"}</Code>
  <Stat label="Budget" value="¥120k" />
  <Divider />
</Sheet>`

describe('page editor blocks', () => {
  test('text-like blocks open for typing; the rest stays whole', () => {
    const kinds = toBlocks(parse(SOURCE)).map((block) => block.kind)
    expect(kinds).toEqual(['h1', 'text', 'todo', 'todo', 'code', 'locked', 'divider'])
  })

  test('an untouched page comes back exactly as it was', () => {
    const root = parse(SOURCE)
    expect(parse(serialize(toSheet(root, toBlocks(root))))).toEqual(root)
  })

  test('list items regroup by kind, empty text is dropped, typed text is escaped', () => {
    const root = parse('<Sheet title="t"></Sheet>')
    const sheet = toSheet(root, [
      newBlock('bullet', 'one'),
      newBlock('bullet', 'two'),
      newBlock('text', ''),
      newBlock('number', 'first'),
      newBlock('text', 'a < b {c}'),
    ])
    expect(sheet.children.map((node) => (node.kind === 'element' ? node.name : 'text'))).toEqual([
      'List',
      'List',
      'Text',
    ])
    expect(parse(serialize(sheet))).toEqual(sheet)
  })

  test('text in several runs stays locked rather than gaining or losing spaces', () => {
    const root = parse('<Sheet title="t"><Text>Tom {"&"} Jerry</Text></Sheet>')
    expect(toBlocks(root).map((block) => block.kind)).toEqual(['locked'])
    expect(parse(serialize(toSheet(root, toBlocks(root))))).toEqual(root)
  })

  test('markdown shortcuts turn a text block into its kind', () => {
    expect(applyShortcut(newBlock('text', '## Goals'))).toMatchObject({ kind: 'h2', text: 'Goals' })
    expect(applyShortcut(newBlock('text', '[] milk'))).toMatchObject({ kind: 'todo', text: 'milk' })
    expect(applyShortcut(newBlock('text', '---'))).toMatchObject({ kind: 'divider' })
    expect(applyShortcut(newBlock('h1', '# not again'))).toBeNull()
  })
})

describe('the / menu drops live data on the page', () => {
  const issues = { name: 'issues', done: { column: 'state', values: ['Done'] } }
  const notes = { name: 'notes', done: null }
  const labels = (query: string) =>
    slashMatches(query, [issues, notes])
      .filter((option) => option.type === 'data')
      .map((option) => option.label)

  test('a view of any table; progress only where a status says what shipped', () => {
    expect(labels('view')).toEqual(['Linked view · issues', 'Linked view · notes'])
    expect(labels('progress')).toEqual(['Progress · issues'])
  })

  test('/database names the new table from what was typed, never a taken name', () => {
    const pickOf = (query: string, taken = [issues, notes]) =>
      slashMatches(query, taken).find((option) => option.type === 'data')
    expect(pickOf('database Bug triage')).toMatchObject({ pick: { name: 'bug_triage' } })
    expect(pickOf('database')).toMatchObject({ pick: { name: 'database' } })
    expect(pickOf('database issues')).toMatchObject({ pick: { name: 'issues_2' } })
  })

  test('pages: a new one inside, a live list or gallery, or a link found by title', () => {
    const pages = [
      { id: 'b1', title: 'Monthly budget' },
      { id: 'i1', title: 'Income' },
    ]
    const of = (query: string) =>
      slashMatches(query, [], pages)
        .filter((option) => option.type === 'data')
        .map((option) => option.label)
    expect(of('page')).toEqual(['New page inside', 'Subpages', 'Subpage gallery'])
    expect(of('link budget')).toContain('Link to page · Monthly budget')
    expect(of('income')).toEqual(['Link to page · Income'])
    const sheet = (node: ReturnType<typeof dataNode>) =>
      validate(
        { kind: 'element', name: 'Sheet', props: { title: 'Hub' }, children: [node] },
        paperRegistry,
      )
    expect(sheet(dataNode({ kind: 'link', sheet: 'b1' }))).toEqual([])
    expect(sheet(dataNode({ kind: 'subpages', layout: 'gallery' }))).toEqual([])
  })

  test('an https address after / embeds it; http is never offered', () => {
    const embed = (query: string) =>
      slashMatches(query, []).find(
        (option) => option.type === 'data' && option.key.startsWith('embed'),
      )
    expect(embed('embed https://open.spotify.com/track/x')).toMatchObject({
      label: 'Embed · open.spotify.com',
      pick: { kind: 'embed', src: 'https://open.spotify.com/track/x' },
    })
    expect(embed('https://tally.so/r/abc')).toMatchObject({ label: 'Embed · tally.so' })
    expect(embed('http://tally.so/r/abc')).toBeUndefined()
    expect(embed('embed')).toMatchObject({ hint: 'paste an https address' })
    const first = (query: string) =>
      slashMatches(query, []).find((option) => option.type === 'data')
    expect(first('bookmark https://bun.com/docs')).toMatchObject({ label: 'Bookmark · bun.com' })
    expect(first('https://bun.com/docs')).toMatchObject({ label: 'Embed · bun.com' })
  })

  test('a bookmark keeps only what the site said, and stays valid without any of it', () => {
    const page = (node: ReturnType<typeof bookmarkNode>) =>
      validate(
        { kind: 'element', name: 'Sheet', props: { title: 'Links' }, children: [node] },
        paperRegistry,
      )
    const seen = { title: 'Bun', description: null, image: 'https://bun.com/og.png', site: null }
    expect(bookmarkNode('https://bun.com', seen).props).toEqual({
      href: 'https://bun.com',
      title: 'Bun',
      image: 'https://bun.com/og.png',
    })
    expect(page(bookmarkNode('https://bun.com', seen))).toEqual([])
    expect(page(bookmarkNode('https://bun.com', null))).toEqual([])
  })

  test('an upload is offered by kind and lands as its own block', () => {
    const labels = (query: string) =>
      slashMatches(query, [])
        .filter((option) => option.type === 'data' && option.key.startsWith('upload'))
        .map((option) => option.label)
    expect(labels('vid')).toEqual(['Video'])
    expect(labels('pdf')).toEqual(['File'])
    const file = { id: 'f1', name: 'plan.pdf', size: 2048 }
    for (const as of ['image', 'video', 'audio', 'file'] as const) {
      const sheet = {
        kind: 'element' as const,
        name: 'Sheet',
        props: { title: 't' },
        children: [uploadNode(as, file)],
      }
      expect(validate(sheet, paperRegistry)).toEqual([])
    }
    expect(uploadNode('file', file).props).toEqual({
      src: 'file:f1',
      name: 'plan.pdf',
      bytes: 2048,
    })
    expect(labels('gallery')).toEqual(['Gallery'])
    const gallery = galleryNode([
      { id: 'a', name: 'one.jpg', size: 10 },
      { id: 'b', name: 'two.jpg', size: 20 },
    ])
    const sheet = {
      kind: 'element' as const,
      name: 'Sheet',
      props: { title: 't' },
      children: [gallery],
    }
    expect(validate(sheet, paperRegistry)).toEqual([])
  })

  test('/script drops a starter that compiles to a valid block', () => {
    const option = slashMatches('script', []).find(
      (each) => each.type === 'data' && each.key === 'script',
    )
    expect(option).toMatchObject({ label: 'Script', hint: 'TypeScript' })
    const node = dataNode({ kind: 'script' })
    const sheet = {
      kind: 'element' as const,
      name: 'Sheet',
      props: { title: 't' },
      children: [node],
    }
    expect(validate(sheet, paperRegistry)).toEqual([])
    expect(serialize(sheet)).toContain('{`function view()')
  })

  test('what lands is valid WSX: a Database, or a Chart over the done statuses', () => {
    const root = parse('<Sheet title="Review" wsx="1"><Title>Review</Title></Sheet>')
    const blocks = [
      ...toBlocks(root),
      lockedBlock(dataNode({ kind: 'view', table: 'issues' })),
      lockedBlock(dataNode({ kind: 'progress', table: issues })),
    ]
    const source = serialize(toSheet(root, blocks))
    expect(source).toContain('<Database table="issues" />')
    expect(source).toContain('history={{')
    expect(hasErrors(validate(parse(source), paperRegistry))).toBe(false)
  })
})

describe('the heading names the page', () => {
  const blocks = (source: string) => toBlocks(parse(source))

  test('a first level-1 heading with text is the page title', () => {
    expect(
      titleOf(blocks('<Sheet title="t"><Title>Sprint review</Title></Sheet>'), { rowOf: null }),
    ).toBe('Sprint review')
  })

  test('an empty heading, a lower heading or a row page keeps the title it has', () => {
    expect(titleOf(blocks('<Sheet title="t"><Title></Title></Sheet>'), { rowOf: null })).toBeNull()
    expect(
      titleOf(blocks('<Sheet title="t"><Title level={2}>Part</Title></Sheet>'), { rowOf: null }),
    ).toBeNull()
    expect(
      titleOf(blocks('<Sheet title="t"><Title>Row</Title></Sheet>'), { rowOf: 'record' }),
    ).toBeNull()
  })
})

describe('locked block frame', () => {
  test('keeps the page theme but never its cover or icon', () => {
    const root = parse(
      `<Sheet title="T" theme="washi" feel="board" cover="picture:fog" icon="💵"><Divider /></Sheet>`,
    )
    if (root.kind !== 'element') throw new Error('not an element')
    expect(blockFrame(root.props)).toEqual({ title: 'T', theme: 'washi', feel: 'board' })
  })
})
