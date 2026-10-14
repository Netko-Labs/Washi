import { PaperProvider, WsxView } from '@washi/paper'
import { paperHost } from '../paper-host'
import { noteIdOf, useSheetsStore, useViewStore } from '../stores'
import { useSheet } from './lib'
import { SheetEmpty, SheetFailed, SheetLoading, SheetMissing } from './sheet-states'

export function SheetView() {
  const pageId = useViewStore((state) => noteIdOf(state.activeTab))
  const version = useSheetsStore(
    (state) => state.sheets.find((sheet) => sheet.id === pageId)?.hlcUpdated,
  )
  const state = useSheet(pageId, version)

  if (state.status === 'idle') return <SheetEmpty />
  if (state.status === 'loading') return <SheetLoading />
  if (state.status === 'missing') return <SheetMissing />
  if (state.status === 'failed') return <SheetFailed error={state.error} />

  // A bare surface: no tape, no card, no byline, no width (spec Q18). Anything
  // the reader sees on a sheet was authored by the sheet.
  return (
    <div className="flex-1 overflow-y-auto" data-sheet-id={state.sheet.id}>
      <PaperProvider host={paperHost}>
        <WsxView key={state.sheet.id} root={state.root} />
      </PaperProvider>
    </div>
  )
}
