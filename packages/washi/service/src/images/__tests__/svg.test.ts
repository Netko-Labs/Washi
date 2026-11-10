import { describe, expect, test } from 'bun:test'
import { Resvg } from '@resvg/resvg-wasm'
import { ImageRenderError, renderHtml } from '..'

const none = async () => null
const SIDE = 100

/** A drawn PNG's pixels, read back through resvg itself (already loaded by the draw). */
function pixelsOf(png: Uint8Array) {
  const data = Buffer.from(png).toString('base64')
  const read = new Resvg(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${SIDE}" height="${SIDE}"><image width="${SIDE}" height="${SIDE}" href="data:image/png;base64,${data}"/></svg>`,
  ).render()
  return (x: number, y: number) => {
    const at = (y * read.width + x) * 4
    return [...read.pixels.slice(at, at + 3)]
  }
}

/** One inline `<svg>` on a white square, drawn and read back. */
async function drawn(svg: string) {
  const png = await renderHtml(
    {
      html: `<div style="display:flex;width:${SIDE}px;height:${SIDE}px;background:#ffffff">${svg}</div>`,
      width: SIDE,
      height: SIDE,
    },
    none,
  )
  return pixelsOf(png)
}

const WHITE = [255, 255, 255]
const RED = [255, 0, 0]
const isDark = ([r = 0, g = 0, b = 0]: number[]) => r + g + b < 200

describe('an inline <svg> in image_render draws as SVG says (D138)', () => {
  test('a clipPath cuts its shape, and leaves the corners to the page', async () => {
    const at = await drawn(
      '<svg width="100" height="100" viewBox="0 0 100 100"><defs><clipPath id="c"><circle cx="50" cy="50" r="40"/></clipPath></defs><rect width="100" height="100" fill="#ff0000" clip-path="url(#c)"/></svg>',
    )
    expect(at(2, 2)).toEqual(WHITE)
    expect(at(50, 50)).toEqual(RED)
  })

  test('a mask shows only where it is white', async () => {
    const at = await drawn(
      '<svg width="100" height="100"><defs><mask id="m"><rect width="100" height="100" fill="black"/><circle cx="50" cy="50" r="30" fill="white"/></mask></defs><rect width="100" height="100" fill="#ff0000" mask="url(#m)"/></svg>',
    )
    expect(at(5, 50)).toEqual(WHITE)
    expect(at(50, 50)).toEqual(RED)
  })

  test('linear and radial gradients run from one stop to the other', async () => {
    const linear = await drawn(
      '<svg width="100" height="100"><defs><linearGradient id="g" x1="0" x2="1"><stop offset="0" stop-color="#ff0000"/><stop offset="1" stop-color="#0000ff"/></linearGradient></defs><rect width="100" height="100" fill="url(#g)"/></svg>',
    )
    expect(linear(2, 50)[0]).toBeGreaterThan(200)
    expect(linear(97, 50)[2]).toBeGreaterThan(200)
    const radial = await drawn(
      '<svg width="100" height="100"><defs><radialGradient id="r"><stop offset="0" stop-color="#ff0000"/><stop offset="1" stop-color="#0000ff"/></radialGradient></defs><rect width="100" height="100" fill="url(#r)"/></svg>',
    )
    expect(radial(50, 50)[0]).toBeGreaterThan(200)
    expect(radial(2, 50)[2]).toBeGreaterThan(200)
  })

  test('<text> draws in the house fonts, sans and serif', async () => {
    for (const family of ['sans-serif', 'serif', 'Washi Serif', 'Georgia']) {
      const at = await drawn(
        `<svg width="100" height="100"><rect width="100" height="100" fill="#ffffff"/><text x="10" y="80" font-size="80" font-family="${family}" fill="#000000">W</text></svg>`,
      )
      let dark = 0
      for (let y = 0; y < SIDE; y += 2)
        for (let x = 0; x < SIDE; x += 2) if (isDark(at(x, y))) dark++
      expect(dark).toBeGreaterThan(50)
    }
  })

  test('<use> repeats a shape, a filter blurs, a <tspan> draws inside its <text>', async () => {
    const used = await drawn(
      '<svg width="100" height="100"><defs><rect id="box" width="20" height="20" fill="#ff0000"/></defs><use href="#box" x="70" y="70"/></svg>',
    )
    expect(used(80, 80)).toEqual(RED)
    expect(used(10, 10)).toEqual(WHITE)
    const blurred = await drawn(
      '<svg width="100" height="100"><defs><filter id="b" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="6"/></filter></defs><rect x="30" y="30" width="40" height="40" fill="#000000" filter="url(#b)"/></svg>',
    )
    // The blur spills past the square's edge: grey where the sharp square would leave white.
    const edge = blurred(26, 50)[0] ?? 255
    expect(edge).toBeLessThan(250)
    expect(edge).toBeGreaterThan(5)
    const spanned = await drawn(
      '<svg width="100" height="100"><text y="80" font-size="70"><tspan x="10" fill="#000000">W</tspan></text></svg>',
    )
    let dark = 0
    for (let y = 0; y < SIDE; y += 2)
      for (let x = 0; x < SIDE; x += 2) if (isDark(spanned(x, y))) dark++
    expect(dark).toBeGreaterThan(50)
  })

  test('a logo of clipped shapes, like Kome, keeps its cut', async () => {
    const at = await drawn(
      `<svg viewBox="0 0 64 64" style="width:100px;height:100px">
        <defs><clipPath id="grain"><path d="M32 4 C48 16 52 40 32 60 C12 40 16 16 32 4 Z"/></clipPath></defs>
        <g clip-path="url(#grain)"><rect width="64" height="64" fill="#dd9a3f"/><rect y="32" width="64" height="32" fill="#8a4b12"/></g>
      </svg>`,
    )
    expect(at(3, 3)).toEqual(WHITE)
    expect(at(50, 30)[0]).toBeGreaterThan(200)
    expect(at(50, 75)[0]).toBeLessThan(160)
  })

  test('nothing is fetched and nothing runs: a remote picture is refused, a script dropped', async () => {
    await expect(
      drawn('<svg width="10" height="10"><image href="https://example.com/a.png"/></svg>'),
    ).rejects.toThrow('nothing is fetched')
    await expect(
      drawn('<svg width="10" height="10"><rect fill="url(https://example.com/p)"/></svg>'),
    ).rejects.toThrow('nothing is fetched')
    const at = await drawn(
      '<svg width="100" height="100" onload="steal()"><script>steal()</script><foreignObject><div>x</div></foreignObject><rect width="100" height="100" fill="#ff0000"/></svg>',
    )
    expect(at(50, 50)).toEqual(RED)
  })

  test('an <svg> with no size says how to give it one', async () => {
    await expect(drawn('<svg><rect width="10" height="10"/></svg>')).rejects.toThrow(
      ImageRenderError,
    )
    await expect(drawn('<svg><rect width="10" height="10"/></svg>')).rejects.toThrow('viewBox')
  })
})
