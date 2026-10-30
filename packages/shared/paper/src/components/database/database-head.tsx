import { AddProperty } from './add-property'
import { ColumnHead } from './column-head'
import type { DatabaseHeadProps } from './lib'

/** The table's head: a menu under every property, then the + that adds one. */
export function DatabaseHead({ db, columns, title, local, onAdd }: DatabaseHeadProps) {
  return (
    <thead>
      <tr>
        {columns.map((column) => {
          const sorted = local.sort?.column === column.name ? local.sort.direction : null
          return (
            <th
              key={column.name}
              data-num={column.type === 'number' || column.format !== undefined || undefined}
              aria-sort={sorted ? (sorted === 'asc' ? 'ascending' : 'descending') : undefined}
            >
              <ColumnHead db={db} column={column} isTitle={column === title} local={local} />
            </th>
          )
        })}
        <th className="wsx-db-plus-cell">
          <AddProperty onAdd={onAdd} taken={db.spec.columns.map((column) => column.name)} />
        </th>
      </tr>
    </thead>
  )
}
