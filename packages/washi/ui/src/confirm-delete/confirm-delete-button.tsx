import { IconTrash } from '@tabler/icons-react'
import { useEffect, useState } from 'react'
import { CONFIRM_WINDOW_MS, type ConfirmDeleteButtonProps } from './lib'

/** Two clicks to delete: a stray hover-click on the trash can no longer erase a page. */
export function ConfirmDeleteButton({
  label,
  onConfirm,
  className = '',
}: ConfirmDeleteButtonProps) {
  const [armed, setArmed] = useState(false)

  useEffect(() => {
    if (!armed) return
    const timer = setTimeout(() => setArmed(false), CONFIRM_WINDOW_MS)
    return () => clearTimeout(timer)
  }, [armed])

  return armed ? (
    <button
      type="button"
      aria-label={`Confirm: ${label}`}
      onClick={onConfirm}
      onMouseLeave={() => setArmed(false)}
      className={`h-5 shrink-0 rounded bg-destructive px-1.5 font-medium text-[11px] text-white ${className}`}
    >
      Delete?
    </button>
  ) : (
    <button
      type="button"
      aria-label={label}
      onClick={() => setArmed(true)}
      className={`grid size-6 shrink-0 place-items-center rounded text-muted-foreground hover:text-destructive ${className}`}
    >
      <IconTrash className="size-3" />
    </button>
  )
}
