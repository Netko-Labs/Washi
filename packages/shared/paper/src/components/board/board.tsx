import { type CSSProperties, Fragment } from 'react'
import { columnOf, styled, useBind } from '../../lib'
import { Bound } from '../states'
import { BoardCard } from './board-card'
import { type BoardProps, columnHue, headCount, useBoardDrag, useCardActions } from './lib'

/** Grouped, draggable records: drop a card and the others slide to make room. */
export function Board({
  bind,
  groupBy,
  groups,
  rank = 'rank',
  title,
  kicker,
  badge,
  meta,
  avatar,
  onAdd,
  onOpen,
  empty,
  ...rest
}: BoardProps) {
  const state = useBind(bind)
  const actions = useCardActions(onOpen)
  const drag = useBoardDrag(bind, state.rows, { groupBy, rank, groups })

  const slot = (group: string, before: string | null) =>
    drag.target?.group === group && drag.target.before === before ? (
      <div className="wsx-board-slot" data-slide="slot" style={{ height: drag.slotHeight }} />
    ) : null

  return (
    <Bound state={state} empty={empty}>
      {(rows) => {
        const titleKey = title ?? columnOf(rows, 'string', ['title', 'name']) ?? 'name'
        return (
          <div ref={drag.boardRef} {...styled(rest, 'wsx-board')}>
            {drag.columns.map(({ name, items }, index) => {
              const resting = items.filter((row) => row.id !== drag.dragging)
              return (
                <section
                  key={name}
                  aria-label={name}
                  className="wsx-board-col"
                  data-hot={drag.target?.group === name || undefined}
                  style={{ '--col': columnHue(name, index) } as CSSProperties}
                  onDragOver={(event) => drag.over(name, event)}
                  onDrop={drag.drop}
                >
                  <div className="wsx-board-head">
                    <span className="wsx-board-head-name">
                      <i />
                      <span className="wsx-board-head-label">{name}</span>
                    </span>
                    <span className="wsx-board-head-count">{headCount(items, meta)}</span>
                  </div>
                  {items.map((row) => (
                    <Fragment key={String(row.id)}>
                      {slot(name, String(row.id))}
                      <BoardCard
                        row={row}
                        titleKey={titleKey}
                        kicker={kicker}
                        badge={badge}
                        meta={meta}
                        avatar={avatar}
                        dragging={drag.dragging === row.id}
                        actions={actions}
                        onDragStart={(event) => drag.start(String(row.id), event)}
                        onDragEnd={drag.end}
                      />
                    </Fragment>
                  ))}
                  {slot(name, null)}
                  {resting.length === 0 && drag.target?.group !== name && (
                    <div className="wsx-board-drop">Drop here</div>
                  )}
                  {onAdd ? (
                    <button
                      type="button"
                      className="wsx-board-add"
                      onClick={() => actions.add(onAdd, name)}
                    >
                      + Add card
                    </button>
                  ) : (
                    actions.creatable && (
                      <button
                        type="button"
                        className="wsx-board-add"
                        onClick={() =>
                          actions.create(bind.table, { [groupBy]: name, [titleKey]: 'Untitled' })
                        }
                      >
                        + New
                      </button>
                    )
                  )}
                </section>
              )
            })}
          </div>
        )
      }}
    </Bound>
  )
}
