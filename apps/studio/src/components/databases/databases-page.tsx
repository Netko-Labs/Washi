import type { TableCatalogEntry } from '@washi/domain'
import { Mascot, useViewStore } from '@washi/ui'
import { useState } from 'react'
import { DatabaseDialog } from './database-dialog'
import { DatabaseRow } from './database-row'
import { useCatalog } from './lib'

/** Every table in the workspace and where it shows — the place to find, and drop, a stray (D109). */
export function DatabasesPage() {
  const { entries, error, trash } = useCatalog()
  const [shown, setShown] = useState<string | null>(null)

  const open = (entry: TableCatalogEntry) => {
    const [page] = entry.pages
    if (page) useViewStore.getState().openTab(`note:${page.id}`)
    else setShown(entry.name)
  }

  return (
    <div className="min-h-0 flex-1 overflow-y-auto overscroll-y-none">
      <div className="fab-room mx-auto w-full max-w-[760px] px-6 pt-10">
        <h1 className="font-semibold text-[26px] tracking-[-0.02em]">Databases</h1>
        <p className="mt-1 text-[13.5px] text-muted-foreground leading-relaxed">
          Every table in this workspace, and the pages that show it. One on no page still keeps its
          rows; open it here, or move it to the trash.
        </p>

        {error && <p className="mt-4 text-[13px] text-destructive">{error}</p>}

        {entries?.length === 0 && (
          <div className="mt-16 flex flex-col items-center gap-3 text-center">
            <Mascot face="sleep" motion="breathe" size={72} className="mascot-motion" />
            <p className="font-serif text-[19px] italic">No databases yet</p>
            <p className="max-w-64 text-[13px] text-muted-foreground">
              Type /database on a page, or ask Washi for one.
            </p>
          </div>
        )}

        {entries && entries.length > 0 && (
          <ul className="mt-6 space-y-px">
            {entries.map((entry) => (
              <DatabaseRow
                key={entry.id}
                entry={entry}
                onOpen={() => open(entry)}
                onTrash={() => trash(entry.id)}
              />
            ))}
          </ul>
        )}
      </div>
      {shown && <DatabaseDialog name={shown} onClose={() => setShown(null)} />}
    </div>
  )
}
