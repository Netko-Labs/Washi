import { AgendaCopyTo } from './agenda-copy-to'
import { AgendaEventActions } from './agenda-event-actions'
import { AgendaEventFields } from './agenda-event-fields'
import { AgendaEventWhen } from './agenda-event-when'
import { AgendaRepeat } from './agenda-repeat'
import {
  type AgendaEventCardProps,
  badgeOf,
  type CopyEntries,
  type EventPatch,
  eventPatch,
  eventTitle,
  hueOf,
  useEventCopy,
  useEventMenu,
  useEventWrite,
} from './lib'

/**
 * An event pressed anywhere on the agenda opens this one card: its time and properties — changed
 * in place by a member, read by anyone else — and what can be done with it: open it as a page,
 * duplicate it, copy it to another day, repeat it, delete it. Every copy is one `table.copy` of the
 * row; every change is the row's own `table.update`.
 */
export function AgendaEventCard({
  row,
  table,
  columns,
  weekStart,
  locale,
  canWrite,
  canCopy,
  onOpenPage,
  onClose,
}: AgendaEventCardProps) {
  const menu = useEventMenu()
  const id = typeof row.id === 'string' ? row.id : null
  const events = useEventCopy(table, String(row.id), menu.close)
  const edit = useEventWrite(table, String(row.id), menu.close)
  const title = eventTitle(row, columns)
  const badge = badgeOf(row, columns)
  const isBusy = events.status.kind === 'busy' || edit.status.kind === 'busy'
  const write = canWrite && id ? (set: EventPatch) => void edit.write(set) : undefined
  const page = {
    row,
    columns,
    locale,
    isBusy,
    onCopy: (entries: CopyEntries) => void events.copy(entries),
    onBack: () => menu.setPage('card'),
  }
  const refusal =
    events.status.kind === 'refused'
      ? `Not copied — ${events.status.reason}`
      : edit.status.kind === 'refused'
        ? `Not saved — ${edit.status.reason}`
        : null

  return (
    <dialog
      ref={menu.dialog}
      className="wsx-dialog wsx-agenda-card"
      aria-label={title}
      onClose={onClose}
      onPointerDown={(event) => event.target === event.currentTarget && menu.close()}
    >
      <div className="wsx-dialog-sheet">
        <div className="wsx-dialog-head">
          <div className="wsx-agenda-card-head" data-hue={hueOf(badge)}>
            <span className="wsx-agenda-card-dot" aria-hidden />
            <h2 className="wsx-dialog-title">{title}</h2>
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
        {menu.page === 'card' && (
          <div className="wsx-agenda-card-body">
            <AgendaEventWhen
              row={row}
              columns={columns}
              locale={locale}
              onChange={write && ((when) => write(eventPatch(when, columns)))}
            />
            <AgendaEventFields row={row} table={table} columns={columns} onWrite={write} />
            <AgendaEventActions
              id={id}
              canCopy={canCopy}
              canDelete={canWrite}
              isBusy={isBusy}
              onOpenPage={
                onOpenPage && id
                  ? () => {
                      menu.close()
                      onOpenPage(id)
                    }
                  : undefined
              }
              onDuplicate={() => void events.copy([{}])}
              onPage={menu.setPage}
              onDelete={() => void edit.remove()}
            />
          </div>
        )}
        {menu.page === 'copy' && <AgendaCopyTo {...page} />}
        {menu.page === 'repeat' && <AgendaRepeat {...page} weekStart={weekStart} />}
        {refusal && (
          <div className="wsx-field-error wsx-agenda-menu-error" role="alert">
            {refusal}
          </div>
        )}
      </div>
    </dialog>
  )
}
