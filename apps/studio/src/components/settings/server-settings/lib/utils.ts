import type { PagePackageState } from './types'

export function sizeLabel(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

/** A row's state in words: what it became, or why not. */
export function packageState(row: PagePackageState): string {
  if (row.status === 'installing') return `Installing ${row.spec}…`
  if (row.status === 'failed') return row.error ?? 'It did not install.'
  return [row.version, row.bytes === null ? null : sizeLabel(row.bytes)].filter(Boolean).join(' · ')
}
