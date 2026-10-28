import { describe, expect, test } from 'bun:test'
import { linkPreview, readPreview } from '../index'

const HTML = `<html><head>
  <title>Fallback &amp; title</title>
  <meta property="og:title" content="The real title" />
  <meta name="description" content="A page about   things &amp; stuff." />
  <meta property="og:image" content="/cover.png" />
  <meta property="og:site_name" content="Example" />
</head><body>…</body></html>`

describe('link previews', () => {
  test('the head says title, description, picture and site', () => {
    expect(readPreview('https://example.com/a', HTML)).toEqual({
      href: 'https://example.com/a',
      title: 'The real title',
      description: 'A page about things & stuff.',
      image: 'https://example.com/cover.png',
      site: 'Example',
    })
  })

  test('without og tags the <title> stands in; an http picture is dropped', () => {
    const plain = readPreview(
      'https://example.com',
      '<title>Just &amp; this</title><meta property="og:image" content="http://x.test/a.png">',
    )
    expect(plain).toMatchObject({ title: 'Just & this', description: null, image: null })
  })

  test('the fetch keeps tsuru’s refusals: http and private ranges never leave', async () => {
    await expect(linkPreview('http://example.com')).rejects.toThrow('https only')
    await expect(linkPreview('https://127.0.0.1/x')).rejects.toThrow(/private/)
  })
})
