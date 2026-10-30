import { whenLabel } from '../../lib'
import { AgendaCopyTo } from './agenda-copy-to'
import { AgendaRepeat } from './agenda-repeat'
import {
  type AgendaEventMenuProps,
  type CopyEntries,
  eventTime,
  eventTitle,
  useEventCopy,
  useEventMenu,
} from './lib'

/**
 * An event's ⋯, over the page: Duplicate lands at once; Copy to… and Repeat on days… ask first.
 * Each is one `table.copy` of the row — every stored property, its date moved, all or nothing.
 */
export function AgendaEventMenu({
  row,
  table,
  columns,
  weekStart,
  locale,
  onClose,
}: AgendaEventMenuProps) {
  const menu = useEventMenu()
  const events = useEventCopy(table, String(row.id), menu.close)
  const title = eventTitle(row, columns)
  const time = eventTime(row, columns)
  const isBusy = events.status.kind === 'busy'
  const page = {
    row,
    columns,
    locale,
    isBusy,
    onCopy: (entries: CopyEntries) => void events.copy(entries),
    onBack: () => menu.setPage('menu'),
  }

  return (
    <dialog
      ref={menu.dialog}
      className="wsx-dialog wsx-agenda-menu"
      aria-label={title}
      onClose={onClose}
      onPointerDown={(event) => event.target === event.currentTarget && menu.close()}
    >
      <div className="wsx-dialog-sheet">
        <div className="wsx-dialog-head">
          <div>
            <h2 className="wsx-dialog-title">{title}</h2>
            <p className="wsx-agenda-menu-when">
              {whenLabel(String(row[columns.date] ?? ''), locale)}
              {time && !String(row[columns.date] ?? '').includes('T') ? ` · ${time}` : ''}
            </p>
          </div>
          <button
            type="button"
            className="wsx-dialog-close"
            aria-label="Close"
            onClick={menu.close}
          >
            ×
          </button>
        </div>
        {menu.page === 'menu' && (
          <div className="wsx-agenda-menu-items">
            <button
              type="button"
              className="wsx-agenda-menu-item"
              disabled={isBusy}
              aria-busy={isBusy || undefined}
              onClick={() => void events.copy([{}])}
            >
              <span aria-hidden>⧉</span> Duplicate
              <span className="wsx-agenda-menu-hint">Same day and time</span>
            </button>
            <button
              type="button"
              className="wsx-agenda-menu-item"
              onClick={() => menu.setPage('copy')}
            >
              <span aria-hidden>→</span> Copy to…
              <span className="wsx-agenda-menu-hint">Another day, same time</span>
            </button>
            <button
              type="button"
              className="wsx-agenda-menu-item"
              onClick={() => menu.setPage('repeat')}
            >
              <span aria-hidden>↻</span> Repeat on days…
              <span className="wsx-agenda-menu-hint">Through a date, same hours</span>
            </button>
          </div>
        )}
        {menu.page === 'copy' && <AgendaCopyTo {...page} />}
        {menu.page === 'repeat' && <AgendaRepeat {...page} weekStart={weekStart} />}
        {events.status.kind === 'refused' && (
          <div className="wsx-field-error wsx-agenda-menu-error" role="alert">
            Not copied — {events.status.reason}
          </div>
        )}
      </div>
    </dialog>
  )
}
