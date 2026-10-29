import { IconArrowUpRight } from '@tabler/icons-react'
import { SheetView } from '@washi/ui'
import { pageLook } from '@/components/page-chrome'
import { RowProperties } from '@/components/row-properties'
import { PEEK_FRAME, type RowPeekProps, usePeek, usePeekEscape } from './lib'
import { RowPeekBar } from './row-peek-bar'

/**
 * A row opened where the reader is, Notion's peek: its name and properties to edit, its page
 * below. The look stays still here — a cover or icon is changed on the row's own page.
 */
export function RowPeek({ workspaceId }: RowPeekProps) {
  const peek = usePeek(workspaceId)
  usePeekEscape(peek.sheetId !== null, peek.close)
  if (!peek.sheetId) return null

  const { edit: _edit, ...look } = pageLook(workspaceId)
  return (
    <>
      <div
        aria-hidden
        onClick={peek.close}
        className="fade-in fixed inset-0 z-40 animate-in bg-black/40 backdrop-blur-[2px] duration-200"
      />
      <aside
        role="dialog"
        aria-modal
        aria-label="Row"
        className={`fade-in fixed z-50 flex animate-in flex-col overflow-hidden border-border bg-background duration-200 ease-out max-md:inset-x-0 max-md:top-[env(safe-area-inset-top)] max-md:bottom-0 max-md:left-0 max-md:h-auto max-md:w-full max-md:min-w-0 max-md:rounded-t-2xl max-md:border-0 max-md:[--tw-enter-scale:1] max-md:[--tw-enter-translate-x:0] max-md:slide-in-from-bottom-16 ${PEEK_FRAME}`}
      >
        <RowPeekBar
          onClose={peek.close}
          onExpand={peek.expand}
          sheetId={peek.sheetId}
          workspaceId={workspaceId}
        />
        <SheetView
          key={peek.sheetId}
          sheetId={peek.sheetId}
          chrome={
            <div className="pt-5">
              <RowProperties sheetId={peek.sheetId} />
            </div>
          }
          look={look}
          footer={
            <div className="mx-auto w-full max-w-[1200px] px-8 pb-12">
              <button
                type="button"
                onClick={peek.expand}
                className="flex items-center gap-1.5 rounded-md px-2 py-1 text-[13px] text-muted-foreground hover:bg-accent hover:text-foreground"
              >
                Write on its page
                <IconArrowUpRight className="size-4" />
              </button>
            </div>
          }
        />
      </aside>
    </>
  )
}
