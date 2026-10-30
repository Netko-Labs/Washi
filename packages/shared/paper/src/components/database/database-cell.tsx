import { CheckCell, FormulaCell, ListCell, RelationCell, TextCell } from './cell-editors'
import { ChoiceCell } from './choice-cell'
import { DateCell } from './date-cell'
import { type CellProps, choicesFor, useRelationTitles } from './lib'
import { NumberCell } from './number-cell'

/** One cell, edited the way its property type reads. */
export function DatabaseCell(props: CellProps) {
  const { db, column, titles } = props
  const target = column.type === 'relation' ? column.table : undefined
  const own = useRelationTitles(target && !titles ? [target] : [])

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
      return <RelationCell {...props} choices={target ? (titles ?? own)[target] : null} />
    case 'number':
      return <NumberCell {...props} />
    case 'formula':
    case 'rollup':
      return <FormulaCell {...props} />
    default:
      return <TextCell {...props} />
  }
}
