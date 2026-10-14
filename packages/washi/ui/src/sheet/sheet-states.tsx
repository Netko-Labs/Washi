import { Mascot } from '../mascot'
import { useSheetsStore, useViewStore } from '../stores'
import type { SheetFailedProps } from './lib'

export function SheetEmpty() {
  return (
    <div className="paper-canvas grid flex-1 place-items-center">
      <div className="flex flex-col items-center gap-3 text-center">
        <Mascot face="happy" motion="bob" size={120} className="mascot-motion" />
        <div className="font-serif text-[23px] italic">Nothing written here yet</div>
        <p className="max-w-72 text-[14px] text-muted-foreground leading-relaxed">
          Start a note and Washi will keep it tidy, tagged and findable.
        </p>
        <button
          type="button"
          onClick={() => void useSheetsStore.getState().createSheet()}
          className="mt-1 rounded-xl bg-primary px-5 py-2.5 font-semibold text-[14px] text-primary-foreground"
        >
          New note
        </button>
      </div>
    </div>
  )
}

/** Quiet lines where the page will be — no spinner, no layout jump when it lands. */
export function SheetLoading() {
  return (
    <div
      role="status"
      className="flex-1 overflow-hidden"
      aria-busy="true"
      aria-label="Loading page"
    >
      <div className="mx-auto max-w-[760px] animate-pulse space-y-4 px-6 pt-14">
        <div className="h-9 w-2/5 rounded-lg bg-muted" />
        <div className="h-4 w-3/5 rounded bg-muted" />
        <div className="mt-8 h-24 rounded-xl bg-muted" />
        <div className="h-4 w-4/5 rounded bg-muted" />
        <div className="h-4 w-2/3 rounded bg-muted" />
      </div>
    </div>
  )
}

export function SheetMissing() {
  return (
    <div className="paper-canvas grid flex-1 place-items-center">
      <div className="flex flex-col items-center gap-3 text-center">
        <Mascot face="sad" motion="sway" size={110} className="mascot-motion" />
        <div className="font-serif text-[23px] italic">This page isn't here</div>
        <p className="max-w-72 text-[14px] text-muted-foreground leading-relaxed">
          It was deleted, or the link points at another workspace.
        </p>
        <button
          type="button"
          onClick={() => useViewStore.getState().openTab('view:dashboard')}
          className="mt-1 rounded-xl border border-border bg-background px-5 py-2.5 font-medium text-[14px] hover:bg-accent"
        >
          Back to the dashboard
        </button>
      </div>
    </div>
  )
}

export function SheetFailed({ error }: SheetFailedProps) {
  return (
    <div className="flex-1 px-8 py-6">
      <p className="font-medium text-[14px]">This page couldn't be shown.</p>
      <p className="mt-1 font-mono text-[12px] text-muted-foreground">{error}</p>
    </div>
  )
}
