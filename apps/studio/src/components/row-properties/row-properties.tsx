import { useSheetsStore } from '@washi/ui'
import { PROPERTY_ICONS, type RowPropertiesProps, usePeople, useRowOf } from './lib'
import { PropertyValue } from './property-value'

/** A row's page opens on the row: its name, then every property, as Notion does. */
export function RowProperties({ sheetId }: RowPropertiesProps) {
  const version = useSheetsStore(
    (state) => state.sheets.find((sheet) => sheet.id === sheetId)?.hlcUpdated,
  )
  const rowOf = useRowOf(sheetId, version)
  const people = usePeople()
  if (!rowOf) return null

  const { table, row, related } = rowOf
  const titleColumn = table.spec.columns.find((column) => column.type === 'text')
  const title = titleColumn ? row[titleColumn.name] : null
  return (
    <div className="pt-6 pb-2" data-row-properties>
      <div className="mb-1 text-[12px] text-muted-foreground">{table.name.replace(/_/g, ' ')}</div>
      <h1 className="font-bold text-[32px] leading-tight">
        {typeof title === 'string' && title ? title : 'Untitled'}
      </h1>
      <dl className="mt-4 grid grid-cols-[150px_1fr] gap-y-1 text-[13.5px]">
        {table.spec.columns
          .filter((column) => column !== titleColumn)
          .map((column) => {
            const Icon = PROPERTY_ICONS[column.type]
            return (
              <div key={column.name} className="contents">
                <dt className="flex h-8 items-center gap-1.5 text-muted-foreground">
                  <Icon className="size-4" />
                  {column.name.replace(/_/g, ' ')}
                </dt>
                <dd className="flex min-h-8 items-center">
                  <PropertyValue
                    column={column}
                    value={row[column.name]}
                    related={related}
                    people={people}
                  />
                </dd>
              </div>
            )
          })}
      </dl>
    </div>
  )
}
