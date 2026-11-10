const PLAIN = /^[-+]?(\d+\.?\d*|\.\d+)(e[-+]?\d+)?$/i
const COMMA_THOUSANDS = /^[-+]?\d{1,3}(,\d{3})+(\.\d+)?$/
const DOT_THOUSANDS = /^[-+]?\d{1,3}(\.\d{3})+,\d+$|^[-+]?\d{1,3}(\.\d{3}){2,}$/
const COMMA_DECIMAL = /^[-+]?\d+,\d+$/
const CURRENCY = /^[-+]?[$€£¥₩₹]/
const SPACING = /[\s  _']/g

/**
 * A number as people write it in a spreadsheet: `1234.5`, `1,234.5`, `1.234,5`, `1 234`, `$12`,
 * `25%` (a ratio: 0.25). Thousands separators are only read as such where they group by three, so
 * `1.5` stays one and a half; `1,5` is read as a decimal comma. Null when it is not a number.
 */
export function parseNumber(written: string): number | null {
  let text = written.trim().replace(SPACING, '')
  const sign = text.startsWith('-') ? '-' : ''
  if (CURRENCY.test(text)) text = sign + text.replace(/^[-+]?./u, '')
  const percent = text.endsWith('%')
  if (percent) text = text.slice(0, -1)
  let plain: string | null = null
  if (PLAIN.test(text)) plain = text
  else if (COMMA_THOUSANDS.test(text)) plain = text.replaceAll(',', '')
  else if (DOT_THOUSANDS.test(text)) plain = text.replaceAll('.', '').replace(',', '.')
  else if (COMMA_DECIMAL.test(text)) plain = text.replace(',', '.')
  if (plain === null) return null
  const value = Number(plain)
  if (!Number.isFinite(value)) return null
  return percent ? value / 100 : value
}
