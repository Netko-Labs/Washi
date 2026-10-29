import type { NumberFormat } from '@washi/ink'

/** A number as the reader reads it (D104): grouped, a ratio as a percent, an amount as money. */
export function formatNumber(value: number, locale?: string, format?: NumberFormat): string {
  const options: Intl.NumberFormatOptions =
    format === 'percent'
      ? { style: 'percent', maximumFractionDigits: 1 }
      : format
        ? { style: 'currency', currency: format }
        : { maximumFractionDigits: 2 }
  return new Intl.NumberFormat(locale, options).format(value)
}
