import { IconTrash } from '@tabler/icons-react'
import { useState } from 'react'
import type { ConfirmRemoveProps } from './lib'

/** A trash button that asks once in the row: the second press removes, leaving it forgets. */
export function ConfirmRemove({ label, title, onConfirm }: ConfirmRemoveProps) {
  const [isAsking, setAsking] = useState(false)

  return isAsking ? (
    <button
      type="button"
      onClick={onConfirm}
      onBlur={() => setAsking(false)}
      ref={(node) => node?.focus()}
      className="h-8 shrink-0 rounded-lg px-2.5 font-medium text-[12.5px] text-destructive hover:bg-accent"
    >
      Remove?
    </button>
  ) : (
    <button
      type="button"
      onClick={() => setAsking(true)}
      aria-label={label}
      title={title ?? 'Remove'}
      className="grid size-8 shrink-0 place-items-center rounded-lg text-muted-foreground hover:bg-accent hover:text-destructive"
    >
      <IconTrash className="size-4" />
    </button>
  )
}
