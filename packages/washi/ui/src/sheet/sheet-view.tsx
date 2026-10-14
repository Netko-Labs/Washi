import { PaperProvider, WsxView } from '@washi/paper'
import { paperHost } from '../paper-host'
import { noteIdOf, useSheetsStore, useViewStore } from '../stores'
import { type SheetViewProps, useSheet } from './lib'
import { SheetEmpty, SheetFailed, SheetLoading, SheetMissing } from './sheet-states'

export function SheetView({ chrome }: SheetViewProps) {
  const pageId = useViewStore((state) => noteIdOf(state.activeTab))
  const summary = useSheetsStore((state) => state.sheets.find((sheet) => sheet.id === pageId))
  const state = useSheet(pageId, summary?.hlcUpdated)

  if (state.status === 'idle') return <SheetEmpty />
  if (state.status === 'loading') return <SheetLoading />
  if (state.status === 'missing') return <SheetMissing />
  if (state.status === 'failed') return <SheetFailed error={state.error} />

  // A bare surface: no tape, no card, no byline (spec Q18). Anything the reader sees on the
  // sheet was authored by the sheet; a host's chrome sits above it, outside the paper.
  return (
    <div
      className="flex-1 overflow-y-auto"
      data-sheet-id={state.sheet.id}
      data-full-width={summary?.fullWidth || undefined}
    >
      {chrome}
      <PaperProvider host={paperHost}>
        <WsxView key={state.sheet.id} root={state.root} />
      </PaperProvider>
    </div>
  )
}
