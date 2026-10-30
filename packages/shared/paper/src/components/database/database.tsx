import { useState } from 'react'
import { styled } from '../../lib'
import { Board } from '../board'
import { Roadmap } from '../roadmap'
import { DatabaseGallery } from './database-gallery'
import { DatabaseTable } from './database-table'
import { choicesFor, type DatabaseProps, defaultViews, titleColumn, useDatabase } from './lib'

/** A Notion database on the page: its views as tabs, its rows edited in place. */
export function Database({ table, views, empty, ...rest }: DatabaseProps) {
  const db = useDatabase(table)
  const [active, setActive] = useState(0)

  if (db === null) {
    return (
      <div className="wsx-empty" data-state="loading" aria-busy>
        Loading…
      </div>
    )
  }
  if (db === 'unreadable') {
    return (
      <div className="wsx-empty" data-state="error" role="alert">
        This database could not load.
      </div>
    )
  }
  if (db === 'missing') {
    return (
      <div className="wsx-empty" data-state="empty">
        No table called “{table}” — it may be in the Trash.
      </div>
    )
  }

  const tabs = views?.length ? views : defaultViews(db.spec)
  const view = tabs[Math.min(active, tabs.length - 1)] ?? { name: 'Table', kind: 'table' as const }
  const group = view.groupBy
    ? db.spec.columns.find((column) => column.name === view.groupBy)
    : undefined
  const rank = db.spec.columns.find((column) => column.name === 'rank' && column.type === 'number')
  const date =
    view.date ?? db.spec.columns.find((column) => column.type === 'date')?.name ?? undefined

  return (
    <section {...styled(rest, 'wsx-db')} aria-label={table}>
      <div className="wsx-db-tabs" role="tablist">
        {tabs.map((tab, index) => (
          <button
            key={tab.name}
            type="button"
            role="tab"
            aria-selected={tab === view}
            className="wsx-db-tab"
            onClick={() => setActive(index)}
          >
            {tab.name}
          </button>
        ))}
      </div>
      {view.kind === 'gallery' ? (
        <DatabaseGallery db={db} view={view} empty={empty} />
      ) : view.kind === 'timeline' && date ? (
        <Roadmap
          bind={{ table, where: view.where }}
          date={date}
          title={titleColumn(db.spec)?.name}
          empty={empty}
        />
      ) : view.kind === 'board' && group ? (
        <Board
          bind={{ table, where: view.where }}
          groupBy={group.name}
          groups={choicesFor(group, db.people).map((choice) => choice.value)}
          title={titleColumn(db.spec)?.name}
          rank={rank ? rank.name : ''}
          empty={empty}
        />
      ) : (
        <DatabaseTable key={view.name} db={db} view={view} empty={empty} />
      )}
    </section>
  )
}
