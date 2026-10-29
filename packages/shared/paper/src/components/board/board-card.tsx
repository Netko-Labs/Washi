import { cellItems, toneOf } from '../../lib'
import { Avatar, Badge } from '../data'
import { cell } from '../states'
import type { BoardCardProps } from './lib'

export function BoardCard({
  row,
  titleKey,
  kicker,
  badge,
  meta,
  avatar,
  dragging,
  actions,
  onDragStart,
  onDragEnd,
}: BoardCardProps) {
  const id = String(row.id)
  return (
    <article
      className="wsx-board-card"
      draggable
      data-card={id}
      data-slide={id}
      data-dragging={dragging || undefined}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onClick={() => actions.open(row)}
      onKeyDown={(event) => event.key === 'Enter' && actions.open(row)}
      tabIndex={actions.openable ? 0 : undefined}
      data-openable={actions.openable ? '' : undefined}
    >
      {kicker && <div className="wsx-board-card-kicker">{actions.shown(row[kicker])}</div>}
      <div className="wsx-board-card-title">{cell(row[titleKey]) || 'Untitled'}</div>
      {(badge || meta || avatar) && (
        <div className="wsx-board-card-meta">
          {badge &&
            cellItems(row, badge).map((item) => (
              <Badge key={String(item)} size="sm" tone={toneOf(String(item))}>
                {actions.shown(item)}
              </Badge>
            ))}
          {meta && <span className="wsx-board-card-note">{actions.shown(row[meta])}</span>}
          {avatar && typeof row[avatar] === 'string' && row[avatar] && (
            <Avatar label={row[avatar] as string} size="sm" />
          )}
        </div>
      )}
    </article>
  )
}
