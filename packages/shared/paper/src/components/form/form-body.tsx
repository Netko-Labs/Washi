import { useId } from 'react'
import { styled } from '../../lib'
import { tableLabel } from '../database'
import { FormField } from './form-field'
import { FormVisitor } from './form-visitor'
import { type FormBodyProps, formPlan, REQUIRED_HINT, SENT_NOTE, useFormDraft } from './lib'

const VISITOR = 'visitor:'

export function FormBody({
  db,
  fields,
  defaults,
  submit,
  reset = true,
  required,
  seed,
  check,
  onAdded,
  onCancel,
  isBooking,
  ...rest
}: FormBodyProps) {
  // A seeded column is written even when it is not shown: the day a calendar's + stood on.
  const plan = formPlan(db.spec, fields, { ...defaults, ...seed }, required)
  const draft = useFormDraft({
    table: db.table,
    written: plan.written,
    required: plan.required,
    defaults,
    seed,
    reset,
    check,
    onAdded,
  })
  const id = useId()

  if (plan.refused.length > 0) {
    return (
      <div className="wsx-empty" data-state="error" role="alert">
        This form can’t add to “{db.table}”: {plan.refused.join('; ')}.
      </div>
    )
  }

  const { status } = draft
  const isSuggesting = draft.mode === 'suggest'
  const label = isSuggesting ? (isBooking ? 'Request' : 'Suggest') : (submit ?? 'Add')
  const missing = status.kind === 'missing' ? status.columns : []
  return (
    <form
      {...styled(rest, 'wsx-form')}
      aria-label={`Add to ${tableLabel(db.table)}`}
      noValidate
      onSubmit={async (event) => {
        event.preventDefault()
        const missing = await draft.submit()
        if (missing) document.getElementById(`${id}-${missing}`)?.focus()
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
          required={plan.required.includes(column)}
          error={
            status.kind === 'missing' && status.columns.includes(column.name)
              ? REQUIRED_HINT
              : undefined
          }
        />
      ))}
      {isSuggesting && (
        <FormVisitor
          id={id}
          visitor={draft.visitor}
          onChange={draft.setVisitor}
          missing={missing.flatMap((key) =>
            key.startsWith(VISITOR) ? [key.slice(VISITOR.length)] : [],
          )}
        />
      )}
      <div className="wsx-form-actions">
        <button
          type="submit"
          className="wsx-button"
          data-tone="accent"
          data-size="sm"
          disabled={status.kind === 'busy'}
          aria-busy={status.kind === 'busy' || undefined}
        >
          {label}
        </button>
        {onCancel && (
          <button type="button" className="wsx-button" data-variant="plain" onClick={onCancel}>
            Cancel
          </button>
        )}
        <span className="wsx-form-status" role="status" aria-live="polite">
          {status.kind === 'added' && (isSuggesting ? SENT_NOTE : 'Added')}
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
