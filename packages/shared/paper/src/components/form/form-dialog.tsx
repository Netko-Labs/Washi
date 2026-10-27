import { useEffect, useRef } from 'react'
import { useDatabase } from '../database'
import { FormBody } from './form-body'
import { FormUnavailable } from './form-unavailable'
import type { FormDialogProps } from './lib'

/**
 * A form over the page: the browser's own modal, so focus stays in it, Escape closes it and it
 * sits above everything. It closes once the row lands; each opening starts from a clean draft.
 */
export function FormDialog({ open, onClose, title, table, seed, ...rest }: FormDialogProps) {
  const db = useDatabase(table)
  const dialog = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const el = dialog.current
    if (!el) return
    if (open && !el.open) el.showModal()
    if (!open && el.open) el.close()
  }, [open])

  return (
    <dialog
      ref={dialog}
      className="wsx-dialog"
      aria-label={title}
      onClose={onClose}
      onPointerDown={(event) => event.target === event.currentTarget && onClose()}
    >
      <div className="wsx-dialog-sheet">
        <div className="wsx-dialog-head">
          <h2 className="wsx-dialog-title">{title}</h2>
          <button type="button" className="wsx-dialog-close" aria-label="Close" onClick={onClose}>
            ×
          </button>
        </div>
        {open &&
          (db === null || db === 'unreadable' || db === 'missing' ? (
            <FormUnavailable db={db} table={table} />
          ) : (
            <FormBody db={db} seed={seed} onAdded={onClose} onCancel={onClose} {...rest} />
          ))}
      </div>
    </dialog>
  )
}
