import { PaperProvider, SheetLookProvider, WsxView } from '@washi/paper'
import { SheetIcon } from '../sheet-icon'
import { type SheetViewProps, usePageSheet } from './lib'
import { SheetEmpty, SheetFailed, SheetLoading, SheetMissing } from './sheet-states'

export function SheetView({ chrome, look, footer, body: Body }: SheetViewProps) {
  const { summary, state, host } = usePageSheet()

  if (state.status === 'idle') return <SheetEmpty />
  if (state.status === 'loading') return <SheetLoading />
  if (state.status === 'missing') return <SheetMissing />
  if (state.status === 'failed') return <SheetFailed error={state.error} />

  // A bare surface: no tape, no card, no byline (spec Q18). Anything the reader sees on the
  // sheet was authored by the sheet — its cover and icon too (D64); a host's band sits under them.
  return (
    <div
      className="group/sheet flex-1 overflow-y-auto overscroll-y-none"
      data-sheet-id={state.sheet.id}
      data-full-width={summary?.fullWidth || undefined}
    >
      <SheetLookProvider
        value={{ ...look, band: chrome, drawIcon: (name) => <SheetIcon name={name} /> }}
      >
        <PaperProvider host={host}>
          {Body ? (
            <Body sheet={state.sheet} root={state.root} />
          ) : (
            <WsxView key={state.sheet.id} root={state.root} />
          )}
        </PaperProvider>
      </SheetLookProvider>
      {footer}
    </div>
  )
}
