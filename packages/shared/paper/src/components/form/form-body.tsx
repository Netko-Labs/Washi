import { useId } from 'react'
import { styled } from '../../lib'
import { tableLabel } from '../database'
import { FormField } from './form-field'
import { type FormBodyProps, formPlan, useFormDraft } from './lib'

export function FormBody({ db, fields, defaults, submit, reset = true, ...rest }: FormBodyProps) {
  const plan = formPlan(db.spec, fields, defaults)
  const draft = useFormDraft({ table: db.table, written: plan.written, defaults, reset })
  const id = useId()

  if (plan.refused.length > 0) {
    return (
      <div className="wsx-empty" data-state="error" role="alert">
        This form can’t add to “{db.table}”: {plan.refused.join('; ')}.
      </div>
    )
  }

  const { status } = draft
  return (
    <form
      {...styled(rest, 'wsx-form')}
      aria-label={`Add to ${tableLabel(db.table)}`}
      noValidate
      onSubmit={(event) => {
        event.preventDefault()
        void draft.submit()
      }}
    >
      {plan.fields.map((column) => (
        <FormField
          key={column.name}
          id={`${id}-${column.name}`}
          column={column}
          value={draft.values[column.name]}
          people={db.people}
          onChange={(value) => draft.set(column.name, value)}
        />
      ))}
      <div className="wsx-form-actions">
        <button
          type="submit"
          className="wsx-button"
          data-tone="accent"
          data-size="sm"
          disabled={!draft.canSubmit}
          aria-busy={status.kind === 'busy' || undefined}
        >
          {submit ?? 'Add'}
        </button>
        <span className="wsx-form-status" role="status" aria-live="polite">
          {status.kind === 'added' && 'Added'}
        </span>
      </div>
      {status.kind === 'refused' && (
        <div className="wsx-field-error wsx-form-error" role="alert">
          {status.reason}
        </div>
      )}
    </form>
  )
}
