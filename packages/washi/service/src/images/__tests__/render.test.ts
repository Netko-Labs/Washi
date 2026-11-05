import { describe, expect, test } from 'bun:test'
import { ImageRenderError, markupOf, renderHtml } from '..'

/** A PNG's own width and height, read off its IHDR chunk. */
const sizeOf = (png: Uint8Array) => {
  const view = new DataView(png.buffer, png.byteOffset, png.byteLength)
  return { width: view.getUint32(16), height: view.getUint32(20) }
}

const PIXEL =
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=='
const none = async () => null

describe('a picture drawn from HTML (D126)', () => {
  test('is a PNG the size asked for', async () => {
    const png = await renderHtml(
      {
        html: '<div style="background:#4f46e5;color:white;padding:24px">Cover</div>',
        width: 300,
        height: 120,
      },
      none,
    )
    expect([...png.slice(1, 4)].map((code) => String.fromCharCode(code)).join('')).toBe('PNG')
    expect(sizeOf(png)).toEqual({ width: 300, height: 120 })
  })

  test('takes a <style> block, and stacks a block’s children as a browser would', async () => {
    const markup = await markupOf(
      '<style>.card{padding:8px;border-radius:12px}</style><section><div class="card">A</div><div class="card">B</div></section>',
      none,
    )
    const section = (markup.props.children as unknown as { props: Record<string, unknown> }[])[0]
    expect(section?.props.style).toEqual({
      display: 'flex',
      flexDirection: 'column',
      boxSizing: 'border-box',
    })
    const cards = section?.props.children as { props: { style: unknown } }[]
    expect(cards[0]?.props.style).toEqual({
      boxSizing: 'border-box',
      padding: '8px',
      borderRadius: '12px',
    })
  })

  test('drops scripts, frames and handlers', async () => {
    const markup = await markupOf(
      '<div onclick="steal()"><script>steal()</script><iframe src="https://x.test"></iframe>Hi</div>',
      none,
    )
    expect(JSON.stringify(markup)).not.toContain('steal')
    expect(JSON.stringify(markup)).not.toContain('iframe')
  })

  test('fetches nothing: an address on the web is refused, in words', async () => {
    const remote = [
      '<img src="https://example.com/a.png" />',
      '<div style="background-image:url(https://example.com/a.png)">x</div>',
      '<div style="background:url(//example.com/a.png)">x</div>',
      '<svg><image href="http://example.com/a.png" /></svg>',
    ]
    for (const html of remote) {
      await expect(markupOf(html, none)).rejects.toThrow(ImageRenderError)
      await expect(markupOf(html, none)).rejects.toThrow('nothing is fetched')
    }
  })

  test('shows a data: picture, and an upload of the workspace’s inlined', async () => {
    const asked: string[] = []
    const inline = async (id: string) => {
      asked.push(id)
      return id === 'logo' ? `data:image/png;base64,${PIXEL}` : null
    }
    const markup = await markupOf(
      `<img src="data:image/png;base64,${PIXEL}" width="8" height="8" /><img src="file:logo" width="8" height="8" /><div style="background-image:url('file:logo')">x</div>`,
      inline,
    )
    expect(JSON.stringify(markup)).not.toContain('file:logo')
    expect(asked).toEqual(['logo'])
    await expect(markupOf('<img src="file:nope" />', inline)).rejects.toThrow(
      'not a picture this workspace keeps',
    )
  })

  test('a semicolon inside a data: address does not split the style', async () => {
    const markup = await markupOf(
      `<div style="background-image:url(data:image/png;base64,${PIXEL});color:red">x</div>`,
      none,
    )
    const div = (
      markup.props.children as unknown as { props: { style: Record<string, string> } }[]
    )[0]
    expect(div?.props.style.color).toBe('red')
    expect(div?.props.style.backgroundImage).toContain('base64')
  })

  test('maps generic font families to the house fonts', async () => {
    const markup = await markupOf('<p style="font-family: Georgia, serif">x</p>', none)
    const p = (
      markup.props.children as unknown as { props: { style: Record<string, string> } }[]
    )[0]
    expect(p?.props.style.fontFamily).toBe('Georgia, Washi Serif, Washi Sans')
  })

  test('refuses markup too large to be a picture', async () => {
    await expect(markupOf('<b>x</b>'.repeat(4000), none)).rejects.toThrow('draw less')
  })
})
