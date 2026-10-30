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
})
