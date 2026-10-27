import { choicesFor, tableLabel, useRelationChoices } from '../database'
import { FormCheck, FormChoice } from './form-choice'
import { FormList } from './form-list'
import { FormText } from './form-text'
import type { FormFieldProps, FormInputProps } from './lib'

/** A labelled input, typed the way its column stores values. */
export function FormField({ people, ...input }: FormFieldProps) {
  const { id, column } = input
  return (
    <div className="wsx-field" data-kind={column.type}>
      <label className="wsx-field-label" htmlFor={id}>
        {tableLabel(column.name)}
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
    </div>
  )
}

function FormRelation(props: FormInputProps) {
  const choices = useRelationChoices(props.column.table)
  return <FormList {...props} choices={choices} />
}
