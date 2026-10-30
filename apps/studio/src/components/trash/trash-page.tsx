import { Mascot } from '@washi/ui'
import { useState } from 'react'
import { ConfirmTextButton } from './confirm-text-button'
import { trashItems, useTrash } from './lib'
import { TrashRow } from './trash-row'
import { TrashedTableRow } from './trashed-table-row'

/** Restore puts a page back where it was, with everything that was inside it. */
export function TrashPage() {
  const { entries, tables, error, restore, purge, empty, restoreTable, purgeTable } = useTrash()
  const [term, setTerm] = useState('')
  const hasAny = (entries?.length ?? 0) + tables.length > 0
  const shown = trashItems(entries ?? [], tables, term)

  return (
    <div className="min-h-0 flex-1 overflow-y-auto overscroll-y-none">
      <div className="fab-room mx-auto w-full max-w-[760px] px-6 pt-10">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h1 className="font-semibold text-[26px] tracking-[-0.02em]">Trash</h1>
            <p className="mt-1 text-[13.5px] text-muted-foreground leading-relaxed">
              Deleted pages and databases wait here, with what was inside them, until you restore
              them or delete them for good.
            </p>
          </div>
          {entries && entries.length > 0 && (
            <ConfirmTextButton idle="Empty trash" armed="Delete all for good" onConfirm={empty} />
          )}
        </div>

        {hasAny && (
          <input
            value={term}
            onChange={(event) => setTerm(event.target.value)}
            placeholder="Search the trash…"
            aria-label="Search the trash"
            className="mt-6 h-9 w-full rounded-lg border border-border bg-card px-3 text-[13px] outline-none focus-visible:border-primary"
          />
        )}

        {error && <p className="mt-4 text-[13px] text-destructive">{error}</p>}

        {entries?.length === 0 && tables.length === 0 && (
          <div className="mt-16 flex flex-col items-center gap-3 text-center">
            <Mascot face="sleep" motion="breathe" size={72} className="mascot-motion" />
            <p className="font-serif text-[19px] italic">Nothing in the trash</p>
            <p className="max-w-64 text-[13px] text-muted-foreground">
              Pages you delete land here first, so nothing is gone by accident.
            </p>
          </div>
        )}

        {shown.length > 0 && (
          <ul className="mt-4 space-y-px">
            {shown.map((item) =>
              item.kind === 'page' ? (
                <TrashRow
                  key={`page:${item.entry.id}`}
                  entry={item.entry}
                  onRestore={() => void restore(item.entry.id)}
                  onPurge={() => void purge(item.entry.id)}
                />
              ) : (
                <TrashedTableRow
                  key={`table:${item.table.id}`}
                  table={item.table}
                  onRestore={() => void restoreTable(item.table.id)}
                  onPurge={() => void purgeTable(item.table.id)}
                />
              ),
            )}
          </ul>
        )}

        {hasAny && shown.length === 0 && (
          <p className="mt-6 text-[13px] text-muted-foreground">Nothing deleted matches that.</p>
        )}
      </div>
    </div>
  )
}
