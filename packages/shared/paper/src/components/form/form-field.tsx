import { choicesFor, tableLabel, useRelationChoices } from '../database'
import { FormCheck, FormChoice } from './form-choice'
import { FormList } from './form-list'
import { FormText } from './form-text'
import type { FormFieldProps, FormInputProps } from './lib'

/** A labelled input, typed the way its column stores values. */
export function FormField({ people, ...input }: FormFieldProps) {
  const { id, column, required, error } = input
  return (
    <div className="wsx-field" data-kind={column.type} data-required={required || undefined}>
      <label className="wsx-field-label" htmlFor={id}>
        {tableLabel(column.name)}
        {required && (
          <span className="wsx-field-required" aria-hidden>
            *
          </span>
        )}
      </label>
      {column.type === 'boolean' ? (
        <FormCheck {...input} />
      ) : column.type === 'select' || column.type === 'status' || column.type === 'person' ? (
        <FormChoice {...input} choices={choicesFor(column, people)} />
      ) : column.type === 'multi_select' ? (
        <FormList {...input} choices={choicesFor(column, people)} />
      ) : column.type === 'relation' ? (
        <FormRelation {...input} />
      ) : (
        <FormText {...input} />
      )}
      {error && (
        <span id={`${id}-error`} className="wsx-field-error">
          {error}
        </span>
      )}
    </div>
  )
}

function FormRelation(props: FormInputProps) {
  const choices = useRelationChoices(props.column.table)
  return <FormList {...props} choices={choices} />
}
