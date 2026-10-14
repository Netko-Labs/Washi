import { describe, expect, test } from 'bun:test'
import { renderToStaticMarkup } from 'react-dom/server'
import { Markdown } from '../markdown'

const html = (text: string) => renderToStaticMarkup(<Markdown text={text} />)

describe('agent replies render as markdown', () => {
  test('emphasis, lists and code are elements, not asterisks', () => {
    const out = html('Made **Reading list**:\n\n- a board\n- a chart\n\nRun `db_define` first.')
    expect(out).toContain('<strong')
    expect(out).toContain('Reading list</strong>')
    expect(out.match(/<li/g)?.length).toBe(2)
    expect(out).toContain('<code')
    expect(out).not.toContain('**')
  })

  test('gfm tables render', () => {
    const out = html('| book | status |\n|---|---|\n| Dune | done |')
    expect(out).toContain('<table')
    expect(out).toContain('<td')
  })

  test('raw html from a model is text, never markup', () => {
    const out = html('<img src=x onerror="alert(1)"> and <script>alert(1)</script>')
    expect(out).not.toContain('<img')
    expect(out).not.toContain('<script')
  })

  test('links leave the app', () => {
    expect(html('[docs](https://washi.netko.dev)')).toContain('target="_blank"')
  })
})
