import { describe, expect, test } from 'bun:test'
import { extractText, parse, type WsxElement, type WsxNode } from '@washi/wsx'
import { checkSource } from '../../sheets/service'
import { markdownToPage } from '../convert'
import { escapeText, linkOf } from '../inline'

const README = `# Kome

[![CI](https://img.shields.io/badge/ci-passing-green.svg)](https://github.com/acme/kome/actions)

A tiny renderer for **paper-like** pages, with *style* and ~~no~~ \`{braces}\` or <angle> brackets.
Routes look like /m/{slug} and a < b > c; snake_case_names stay as typed.

## Install

\`\`\`bash
bun add kome   # needs {bun} >= 1.2
\`\`\`

## Status

| Feature | Status | Owner |
| --- | :---: | --- |
| Sign-in | **Done** | Rin |
| Search | \`/s/{query}\` | |

## Plan

1. Cut the branch
2. Ship it
   - [x] Notarize
   - [ ] Announce

- [x] Tests
- [ ] Docs, see [the guide](https://example.com/guide) and [local](./docs/guide.md)

> Nothing here names a colour.

> [!WARNING]
> Do not run this on **production**.

---

![Screenshot](https://example.com/shot.png "The board")

<p align="center"><img src="logo.svg"></p>

Text with a note[^1].

[^1]: The note itself.
`

/** The first element named `name`, depth first. */
function find(node: WsxNode, name: string): WsxElement | undefined {
  if (node.kind !== 'element') return undefined
  if (node.name === name) return node
  for (const child of node.children) {
    const found = find(child, name)
    if (found) return found
  }
  return undefined
}

const all = (node: WsxNode, name: string): WsxElement[] =>
  node.kind !== 'element'
    ? []
    : [...(node.name === name ? [node] : []), ...node.children.flatMap((child) => all(child, name))]

const textOf = (node: WsxElement | undefined) =>
  node?.children.map((child) => (child.kind === 'text' ? child.value : '')).join('') ?? ''

describe('Markdown as a page (D136)', () => {
  const page = markdownToPage(README)
  const root = parse(page.source)

  test('a realistic README passes the same check as sheet_check, and round-trips', () => {
    const check = checkSource(page.source)
    expect(check.diagnostics.filter((each) => each.severity === 'error')).toEqual([])
    expect(check.ok).toBe(true)
    expect(parse(page.source)).toEqual(page.root)
  })

  test('the leading heading is the title, said once', () => {
    expect(page.title).toBe('Kome')
    expect(root.props.title).toBe('Kome')
    expect(all(root, 'Title').map((each) => textOf(each))).toEqual(['Install', 'Status', 'Plan'])
    expect(all(root, 'Title').every((each) => each.props.level === 2)).toBe(true)
    expect(markdownToPage(README, { title: 'Other' }).root.children[0]).toMatchObject({
      name: 'Title',
      props: { level: 1 },
    })
  })

  test('braces and angle brackets read as typed; marks stay marks', () => {
    const words = extractText(root)
    expect(words).toContain('`{braces}` or <angle> brackets')
    expect(words).toContain('/m/{slug} and a < b > c; snake_case_names stay as typed')
    expect(words).toContain('**paper-like**')
    expect(words).toContain('*style*')
    expect(words).toContain('~~no~~')
    expect(textOf(find(root, 'Code'))).toBe('bun add kome   # needs {bun} >= 1.2')
    expect(find(root, 'Code')?.props.lang).toBe('bash')
  })

  test('a badge is a link by its words; links keep where they go', () => {
    expect(extractText(root)).toContain('[CI](https://github.com/acme/kome/actions)')
    expect(extractText(root)).toContain('[the guide](https://example.com/guide)')
    expect(extractText(root)).toContain('local (./docs/guide.md)')
  })

  test('a pipe table is a written Table', () => {
    expect(find(root, 'Table')?.props).toEqual({
      columns: ['Feature', 'Status', 'Owner'],
      rows: [
        ['Sign-in', '**Done**', 'Rin'],
        ['Search', '`/s/{query}`', null],
      ],
    })
  })

  test('lists nest; checked boxes are done', () => {
    const [numbered, checks] = all(root, 'List').filter((each) => each.props.marker !== 'check')
    expect(numbered?.props.marker).toBe('number')
    expect(checks).toBeUndefined()
    const checkLists = all(root, 'List').filter((each) => each.props.marker === 'check')
    expect(checkLists).toHaveLength(2)
    const nested = checkLists[0]
    expect(nested?.children.map((item) => (item as WsxElement).props.done ?? false)).toEqual([
      true,
      false,
    ])
    expect(find((numbered as WsxElement).children[1] as WsxElement, 'List')).toBe(nested)
  })

  test('a quote is a Quote, an alert a Callout, a lone picture a Figure, a rule a Divider', () => {
    expect(textOf(find(root, 'Quote'))).toBe('Nothing here names a colour.')
    expect(find(root, 'Callout')).toMatchObject({
      props: { tone: 'warning', title: 'Warning' },
      children: [{ kind: 'text', value: 'Do not run this on **production**.' }],
    })
    expect(find(root, 'Divider')).toBeDefined()
    expect(find(root, 'Figure')?.props).toEqual({
      src: 'https://example.com/shot.png',
      alt: 'Screenshot',
      caption: 'The board',
    })
  })

  test('HTML and footnotes are never dropped: kept as written in Code', () => {
    const codes = all(root, 'Code').map((each) => textOf(each))
    expect(codes).toContain('<p align="center"><img src="logo.svg"></p>')
    expect(codes).toContain('[^1]: The note itself.')
    expect(extractText(root)).toContain('note\\[^1\\]')
    expect(page.kept).toEqual([
      'inline html <angle> (line 5)',
      'html (line 40)',
      'footnoteDefinition (line 44)',
    ])
  })

  test('HTML inside a line stays as visible words and is listed in kept; <br> is a line break', () => {
    const inline = markdownToPage(
      'Press <kbd>Ctrl</kbd>+<kbd>K</kbd> <!-- the palette -->\nthen<br>go.',
    )
    expect(textOf(find(parse(inline.source), 'Text'))).toBe(
      'Press <kbd>Ctrl</kbd>+<kbd>K</kbd> <!-- the palette --> then\ngo.',
    )
    expect(inline.kept).toEqual([
      'inline html <kbd> (line 1)',
      'inline html </kbd> (line 1)',
      'inline html <kbd> (line 1)',
      'inline html </kbd> (line 1)',
      'inline html <!-- the palette --> (line 1)',
    ])
    expect(checkSource(inline.source).ok).toBe(true)
  })

  test('a quoted title and a picture holding quotes and backslashes round-trip and pass', () => {
    const quoted = markdownToPage(
      '# Say "hi" from C:\\Users\\x\n\n![The "big" one, C:\\Temp](https://example.com/a.png)\n',
    )
    expect(quoted.title).toBe('Say "hi" from C:\\Users\\x')
    expect(checkSource(quoted.source).ok).toBe(true)
    const root = parse(quoted.source)
    expect(root.props.title).toBe('Say "hi" from C:\\Users\\x')
    expect(find(root, 'Figure')?.props.alt).toBe('The "big" one, C:\\Temp')
  })

  test('a table wider than paper takes stays Markdown; a long one splits by 200 rows', () => {
    const wide = `| ${Array.from({ length: 17 }, (_, at) => `c${at}`).join(' | ')} |\n|${' --- |'.repeat(17)}\n`
    expect(markdownToPage(wide).root.children[0]).toMatchObject({
      name: 'Code',
      props: { lang: 'markdown' },
    })
    const long = `| n |\n| - |\n${Array.from({ length: 450 }, (_, at) => `| ${at} |`).join('\n')}\n`
    const tables = markdownToPage(long).root.children as WsxElement[]
    expect(tables.map((each) => (each.props.rows as unknown[]).length)).toEqual([200, 200, 50])
    expect(checkSource(markdownToPage(long).source).ok).toBe(true)
  })

  test('nothing, or a document with no heading, is still a page', () => {
    expect(markdownToPage('').title).toBe('Imported page')
    expect(checkSource(markdownToPage('').source).ok).toBe(true)
    expect(markdownToPage('just words').root.children).toEqual([
      {
        kind: 'element',
        name: 'Text',
        props: {},
        children: [{ kind: 'text', value: 'just words' }],
      },
    ])
  })

  test('words are escaped only where they would read as a mark', () => {
    expect(escapeText('a * b [x] `c` ~~d~~ snake_case _e_')).toBe(
      'a \\* b \\[x\\] \\`c\\` \\~\\~d\\~\\~ snake_case \\_e\\_',
    )
    expect(linkOf('Docs', 'https://en.wikipedia.org/wiki/Paper_(material)')).toBe(
      '[Docs](https://en.wikipedia.org/wiki/Paper_%28material%29)',
    )
    expect(linkOf('Top', '#install')).toBe('Top')
    expect(linkOf('Mail', 'mailto:rin@example.com')).toBe('[Mail](mailto:rin@example.com)')
  })

  test('more than one import takes is refused in words', () => {
    expect(() => markdownToPage('x'.repeat(500_001))).toThrow(/one import takes 500000/)
  })
})
