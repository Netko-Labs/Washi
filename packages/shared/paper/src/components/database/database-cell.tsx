import { CheckCell, ChoiceCell, DateCell, ListCell, TextCell } from './cell-editors'
import { type CellProps, choicesFor, useRelationChoices } from './lib'

/** One cell, edited the way its property type reads. */
export function DatabaseCell(props: CellProps) {
  const { db, column } = props
  const related = useRelationChoices(column.type === 'relation' ? column.table : undefined)

  switch (column.type) {
    case 'boolean':
      return <CheckCell {...props} />
    case 'date':
      return <DateCell {...props} />
    case 'select':
    case 'status':
    case 'person':
      return <ChoiceCell {...props} choices={choicesFor(column, db.people)} />
    case 'multi_select':
      return <ListCell {...props} choices={choicesFor(column, db.people)} />
    case 'relation':
      return <ListCell {...props} choices={related} />
    default:
      return <TextCell {...props} />
  }
}
