import type { TrashEntry, TrashedTable } from '@washi/domain'
import type { TrashItem } from './types'

const stampOf = (item: TrashItem) =>
  item.kind === 'page' ? item.entry.deletedAt : item.table.deletedAt

const nameOf = (item: TrashItem) => (item.kind === 'page' ? item.entry.title : item.table.name)

/** Pages and databases in one list, the newest deleted first; stamps are HLCs, so they sort. */
export function trashItems(
  entries: readonly TrashEntry[],
  tables: readonly TrashedTable[],
  term: string,
): TrashItem[] {
  const needle = term.trim().toLowerCase()
  return [
    ...entries.map((entry): TrashItem => ({ kind: 'page', entry })),
    ...tables.map((table): TrashItem => ({ kind: 'table', table })),
  ]
    .filter((item) => nameOf(item).toLowerCase().includes(needle))
    .sort((a, b) => (stampOf(a) < stampOf(b) ? 1 : stampOf(a) > stampOf(b) ? -1 : 0))
}
