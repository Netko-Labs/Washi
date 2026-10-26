import { frameOf, PaperProvider, SheetBand, WsxView } from '@washi/paper'
import { type SheetViewProps, usePageSheet } from './lib'
import { SheetEmpty, SheetFailed, SheetLoading, SheetMissing } from './sheet-states'

export function SheetView({ chrome, footer, body: Body }: SheetViewProps) {
  const { summary, state, host } = usePageSheet()

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
      {chrome && <SheetBand {...frameOf(state.root)}>{chrome}</SheetBand>}
      <PaperProvider host={host}>
        {Body ? (
          <Body sheet={state.sheet} root={state.root} />
        ) : (
          <WsxView key={state.sheet.id} root={state.root} />
        )}
      </PaperProvider>
      {footer}
    </div>
  )
}
