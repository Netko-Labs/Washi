import type { NumberFormat } from '@washi/ink'

const HUGE = 1e15
const TINY = 1e-6
const SCIENTIFIC: Intl.NumberFormatOptions = {
  notation: 'scientific',
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
}

/**
 * A number as the reader reads it (D104): grouped, a ratio as a percent, an amount as money.
 * Past a quadrillion, or nonzero under a millionth, it reads in scientific notation.
 */
export function formatNumber(value: number, locale?: string, format?: NumberFormat): string {
  const size = Math.abs(value)
  const isScientific = Number.isFinite(value) && (size >= HUGE || (size > 0 && size < TINY))
  const options: Intl.NumberFormatOptions =
    format === 'percent'
      ? { style: 'percent', maximumFractionDigits: 1 }
      : format
        ? { style: 'currency', currency: format }
        : { maximumFractionDigits: 2 }
  return new Intl.NumberFormat(
    locale,
    isScientific ? { ...options, ...SCIENTIFIC } : options,
  ).format(value)
}
