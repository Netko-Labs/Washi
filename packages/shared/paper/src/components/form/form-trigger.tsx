import { useState } from 'react'
import { styled } from '../../lib'
import { tableLabel } from '../database'
import { FormDialog } from './form-dialog'
import type { FormProps } from './lib'

/** `<Form trigger>`: one button on the page, the form in a modal when it is pressed. */
export function FormTrigger({ trigger, title, table, ...rest }: FormProps) {
  const [open, setOpen] = useState(false)
  const label = trigger ?? `Add to ${tableLabel(table)}`
  const { variant, tone, size, emphasis, span, class: className, ...form } = rest
  return (
    <>
      <button
        type="button"
        {...styled(
          { variant, tone: tone ?? 'accent', size, emphasis, span, class: className },
          'wsx-button wsx-form-trigger',
        )}
        aria-haspopup="dialog"
        onClick={() => setOpen(true)}
      >
        <span aria-hidden className="wsx-form-trigger-plus">
          +
        </span>
        {label}
      </button>
      <FormDialog
        open={open}
        onClose={() => setOpen(false)}
        title={title ?? label}
        table={table}
        {...form}
      />
    </>
  )
}
