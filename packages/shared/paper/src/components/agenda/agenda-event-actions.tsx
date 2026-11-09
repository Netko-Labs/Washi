import { useState } from 'react'
import type { AgendaEventActionsProps } from './lib'

/**
 * What can be done with the event, in one row: open it as a page, copy it, delete it. Delete asks
 * once more in place — its page goes to the Trash, where it can be restored.
 */
export function AgendaEventActions({
  id,
  canCopy,
  canDelete,
  isBusy,
  onOpenPage,
  onDuplicate,
  onPage,
  onDelete,
}: AgendaEventActionsProps) {
  const [isSure, setSure] = useState(false)
  if (!onOpenPage && !canCopy && !canDelete) return null

  return (
    <div className="wsx-agenda-card-actions">
      {onOpenPage && id && (
        <button type="button" className="wsx-agenda-card-action" onClick={onOpenPage}>
          <span aria-hidden>↗</span> Open page
        </button>
      )}
      {canCopy && (
        <>
          <button
            type="button"
            className="wsx-agenda-card-action"
            disabled={isBusy}
            aria-busy={isBusy || undefined}
            title="Same day and time"
            onClick={onDuplicate}
          >
            <span aria-hidden>⧉</span> Duplicate
          </button>
          <button
            type="button"
            className="wsx-agenda-card-action"
            title="Another day, same time"
            onClick={() => onPage('copy')}
          >
            <span aria-hidden>→</span> Copy to…
          </button>
          <button
            type="button"
            className="wsx-agenda-card-action"
            title="Chosen weekdays through a date, same hours"
            onClick={() => onPage('repeat')}
          >
            <span aria-hidden>↻</span> Repeat…
          </button>
        </>
      )}
      {canDelete && (
        <button
          type="button"
          className="wsx-agenda-card-action"
          data-danger
          disabled={isBusy}
          onClick={() => (isSure ? onDelete() : setSure(true))}
          onBlur={() => setSure(false)}
        >
          {isSure ? 'Delete — sure?' : 'Delete'}
        </button>
      )}
    </div>
  )
}
