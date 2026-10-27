import { FormInline } from './form-inline'
import { FormTrigger } from './form-trigger'
import type { FormProps } from './lib'

/** One whole row, typed and added: every input its column's kind, validated where it lands. */
export function Form({ trigger, title, ...rest }: FormProps) {
  return trigger ? (
    <FormTrigger trigger={trigger} title={title} {...rest} />
  ) : (
    <FormInline {...rest} />
  )
}
