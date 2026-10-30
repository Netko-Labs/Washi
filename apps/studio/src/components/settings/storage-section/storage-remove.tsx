import { Floating } from '@/components/shared/floating'
import { useMenu } from '../lib'
import { STORAGE_COPY, type StorageRemoveProps } from './lib'

const GHOST =
  'h-[30px] rounded-lg px-2.5 text-[12.5px] text-muted-foreground hover:bg-accent hover:text-foreground'

/** Remove asks once, in a popover: what moves back, and what stays behind. */
export function StorageRemove({ onRemove }: StorageRemoveProps) {
  const menu = useMenu()

  const confirm = async () => {
    if (await onRemove()) menu.close()
  }

  return (
    <div ref={menu.root} className="relative">
      <button
        type="button"
        onClick={menu.isOpen ? menu.close : menu.open}
        aria-expanded={menu.isOpen}
        className={GHOST}
      >
        Remove
      </button>
      {menu.isOpen && (
        <Floating
          anchor={menu.root}
          align="end"
          offset={6}
          role="dialog"
          aria-label="Go back to the server’s store"
          className="w-[300px] rounded-xl border border-border bg-popover p-3 text-popover-foreground shadow-[0_16px_48px_rgb(0_0_0/0.22)]"
        >
          <p className="text-[13px]">{STORAGE_COPY.removeWarn}</p>
          <div className="mt-3 flex justify-end gap-1.5">
            <button type="button" onClick={menu.close} className={GHOST}>
              Keep it
            </button>
            <button
              type="button"
              onClick={() => void confirm()}
              className="h-[30px] rounded-lg bg-destructive px-3 font-medium text-[12.5px] text-destructive-foreground"
            >
              Go back to the server
            </button>
          </div>
        </Floating>
      )}
    </div>
  )
}
