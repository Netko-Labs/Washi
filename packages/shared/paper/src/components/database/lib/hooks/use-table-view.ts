import type { DatabaseContext, DatabaseView, TableView } from '../types'
import { isRank, namedColumns, sortRows, titleColumn } from '../utils'
import { useRecords } from './use-records'
import { useViewLocal } from './use-view-local'

/** A table view's rows and columns as this reader sees them: the page's view, then their own. */
export function useTableView(db: DatabaseContext, view: DatabaseView): TableView {
  const records = useRecords(db.table, view.where)
  const local = useViewLocal()

  const title = titleColumn(db.spec)
  const shown = view.columns
    ? namedColumns(db.spec, view.columns)
    : db.spec.columns.filter((column) => !isRank(column))
  const all = title && !shown.includes(title) ? [title, ...shown] : shown
  const columns = all.filter((column) => column === title || !local.hidden.includes(column.name))
  const sorted = local.sort && db.spec.columns.find((column) => column.name === local.sort?.column)
  const rows =
    sorted && local.sort
      ? sortRows(records.rows, sorted, local.sort.direction, db.people)
      : records.rows

  return { records, rows, columns, title, local }
}
