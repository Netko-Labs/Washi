import { describe, expect, test } from 'bun:test'
import { openSandbox } from '../sandbox'

const open = () =>
  openSandbox('', { prelude: '', names: [], deadlineMs: 100, memoryBytes: 8 * 1024 * 1024 })

describe('numbers read in the sandbox as in the browser', () => {
  test('toLocaleString and Intl.NumberFormat group digits, round, and name money and shares', async () => {
    const sandbox = await open()
    const read = (code: string) => sandbox.call(`String(${code})`, null)
    const cases: [string, string][] = [
      ['(1126).toLocaleString()', '1,126'],
      ['(-1234567.891).toLocaleString()', '-1,234,567.891'],
      ['(0.12345).toLocaleString()', '0.123'],
      ["(1126.5).toLocaleString('en-US', { minimumFractionDigits: 2 })", '1,126.50'],
      ['(2.5).toLocaleString(undefined, { maximumFractionDigits: 0 })', '3'],
      [
        "new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(1234.5)",
        '$1,234.50',
      ],
      [
        "Intl.NumberFormat('en', { style: 'currency', currency: 'chf' }).format(-3)",
        '-CHF\u00a03.00',
      ],
      ["new Intl.NumberFormat('en-US', { style: 'percent' }).format(0.256)", '26%'],
      ["(1234).toLocaleString('en-US', { useGrouping: false })", '1234'],
    ]
    for (const [code, expected] of cases) expect(read(code)).toEqual({ ok: true, value: expected })
    for (const [code, expected] of cases)
      expect(String(new Function(`return ${code}`)())).toBe(expected)
    sandbox.dispose()
  })

  test('a locale is the host’s own, and a bad one throws as Intl does', async () => {
    const sandbox = await open()
    const read = (code: string) => sandbox.call(`String(${code})`, null)
    const cases = [
      "(1234567.5).toLocaleString('de-DE')",
      "new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(1234.5)",
      "(0.256).toLocaleString(['fr-FR'], { style: 'percent' })",
      "new Intl.NumberFormat('ja-JP', { style: 'currency', currency: 'JPY' }).format(5000)",
      "Intl.NumberFormat('de-DE').resolvedOptions().locale",
    ]
    for (const code of cases) {
      expect(read(code)).toEqual({ ok: true, value: String(new Function(`return ${code}`)()) })
    }
    expect(read("(1234567.5).toLocaleString('de-DE')")).toEqual({ ok: true, value: '1.234.567,5' })
    const bad = read("(1).toLocaleString('en', { style: 'currency' })")
    expect(bad.ok).toBe(false)
    expect(read("(() => { try { Intl.NumberFormat('x-bad-') } catch (e) { return e.name } })()"))
      .toEqual({ ok: true, value: 'RangeError' })
    sandbox.dispose()
  })
})
