import type { RowOf } from '@washi/domain'
import type { QueryRow, RecordData, TableSpec } from '@washi/ink'
import {
  createSheet,
  deleteSheet,
  executeQuery,
  findRecordTableId,
  findRowSheet,
  getSheet,
  listTables,
  updateSheetMeta,
  type Workspace,
} from '@washi/repository'
import { parse } from '@washi/wsx'
import { indexOf } from '../sheets/service'
import { restoreSheetTree } from '../sheets/tree'
import { InkError } from './errors'

type Row = Omit<RowOf, 'related'>

function rowById(ws: Workspace, recordId: string): Row {
  const tableId = findRecordTableId(ws, recordId)
  const table = tableId ? listTables(ws).find((each) => each.id === tableId) : undefined
  if (!table) throw new InkError(`unknown record "${recordId}"`)
  const [row] = executeQuery(ws, table.id, table.spec, {
    table: table.name,
    where: [{ column: 'id', op: 'eq', value: recordId }],
    limit: 1,
  }).rows
  if (!row) throw new InkError(`unknown record "${recordId}"`)
  return { table, row }
}

function titleColumn(spec: TableSpec) {
  return spec.columns.find((each) => each.type === 'text')
}

/** Notion's title property: the first text column holds the row's name. */
export function rowTitle(spec: TableSpec, row: QueryRow): string {
  const column = titleColumn(spec)
  const value = column ? row[column.name] : null
  return typeof value === 'string' && value.trim() ? value.trim().slice(0, 200) : 'Untitled'
}

/** A row's page, made the first time anyone opens it; its title follows the row's. */
export function openRowPage(ws: Workspace, recordId: string): string {
  const { table, row } = rowById(ws, recordId)
  const title = rowTitle(table.spec, row)
  const existing = findRowSheet(ws, recordId)
  if (!existing) {
    const source = `<Sheet title={${JSON.stringify(title)}} wsx="1">\n</Sheet>\n`
    const root = parse(source)
    const index = indexOf(root)
    return createSheet(ws, { title, source }, index, null, null, recordId).id
  }
  if (existing.trashed) restoreSheetTree(ws, existing.id)
  syncTitle(ws, existing.id, title)
  return existing.id
}

function syncTitle(ws: Workspace, sheetId: string, title: string): void {
  if (getSheet(ws, sheetId)?.title !== title) updateSheetMeta(ws, sheetId, { title })
}

/** Renaming a row renames its page, wherever the rename came from. */
export function renameRowPages(
  ws: Workspace,
  spec: TableSpec,
  patch: RecordData,
  recordIds: string[],
): void {
  const title = titleColumn(spec)
  if (!title || !(title.name in patch)) return
  for (const id of recordIds) {
    const page = findRowSheet(ws, id)
    if (page) syncTitle(ws, page.id, rowTitle(spec, rowById(ws, id).row))
  }
}

function relatedTitles(ws: Workspace, { table, row }: Row): Record<string, string> {
  const tables = listTables(ws)
  const titles: Record<string, string> = {}
  for (const column of table.spec.columns) {
    const ids = row[column.name]
    const target = tables.find((each) => each.name === column.table)
    if (column.type !== 'relation' || !Array.isArray(ids) || ids.length === 0 || !target) continue
    const rows = executeQuery(ws, target.id, target.spec, {
      table: target.name,
      where: [{ column: 'id', op: 'in', value: ids }],
      limit: ids.length,
    }).rows
    for (const each of rows) titles[String(each.id)] = rowTitle(target.spec, each)
  }
  return titles
}

export function rowOfSheet(ws: Workspace, sheetId: string): RowOf | null {
  const rowId = getSheet(ws, sheetId)?.rowOf
  if (!rowId || !findRecordTableId(ws, rowId)) return null
  const found = rowById(ws, rowId)
  return { ...found, related: relatedTitles(ws, found) }
}

/** A deleted row takes its page to the Trash with it. */
export function trashRowPages(ws: Workspace, recordIds: string[]): void {
  for (const id of recordIds) {
    const page = findRowSheet(ws, id)
    if (page && !page.trashed) deleteSheet(ws, page.id)
  }
}
