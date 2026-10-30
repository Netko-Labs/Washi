import { GalleryCard } from './gallery-card'
import {
  isRank,
  namedColumns,
  newRow,
  titleColumn,
  useRecords,
  useRowActions,
  type ViewProps,
} from './lib'

/** Notion's gallery: a card per row, its cover on top; a press opens the row as its page. */
export function DatabaseGallery({ db, view, empty }: ViewProps) {
  const records = useRecords(db.table, view.where)
  const actions = useRowActions(db.table)
  const title = titleColumn(db.spec)
  const cover = db.spec.columns.find((column) => column.name === view.cover)
  const shown = view.columns
    ? namedColumns(db.spec, view.columns).filter((column) => column !== title)
    : db.spec.columns
        .filter((column) => column !== title && column !== cover && !isRank(column))
        .slice(0, 3)

  if (records.status === 'error') {
    return (
      <div className="wsx-empty" data-state="error" role="alert">
        This view could not load.
      </div>
    )
  }
  return (
    <div className="wsx-db-gallery">
      {records.rows.map((row) => (
        <GalleryCard
          key={String(row.id)}
          db={db}
          row={row}
          title={title}
          cover={cover}
          shown={shown}
          onOpen={actions.canOpen ? () => actions.open(String(row.id)) : undefined}
        />
      ))}
      {records.status === 'ready' && records.rows.length === 0 && empty && (
        <p className="wsx-empty">{empty}</p>
      )}
      <button
        type="button"
        className="wsx-db-card wsx-db-card-new"
        onClick={() => void actions.addRow(newRow(db.spec))}
      >
        + New
      </button>
    </div>
  )
}
