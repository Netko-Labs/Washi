import { DatabaseCell, isRank, PaperProvider, PaperSurface, tableLabel } from '@washi/paper'
import { paperHost } from '@washi/ui'
import { PROPERTY_ICONS, type RowPropertiesProps, useRowPage } from './lib'
import { RowTitle } from './row-title'

/** A row's page opens on the row: its name, then every property, each editable as Notion does. */
export function RowProperties({ sheetId }: RowPropertiesProps) {
  const page = useRowPage(sheetId)
  if (!page) return null

  const { rowOf, people, save } = page
  const { table, row } = rowOf
  const titleColumn = table.spec.columns.find((column) => column.type === 'text')
  const title = titleColumn ? row[titleColumn.name] : null
  const db = { table: table.name, spec: table.spec, people }
  return (
    <div className="pt-6 pb-2" data-row-properties>
      <div className="mb-1 text-[12px] text-muted-foreground">{tableLabel(table.name)}</div>
      {titleColumn ? (
        <RowTitle
          value={typeof title === 'string' ? title : ''}
          onSave={(next) => void save(titleColumn.name, next)}
        />
      ) : (
        <h1 className="font-bold text-[32px] leading-tight">Untitled</h1>
      )}
      <PaperProvider host={paperHost}>
        <dl className="mt-4 grid grid-cols-[150px_1fr] gap-y-1 text-[13.5px]">
          {table.spec.columns
            .filter((column) => column !== titleColumn && !isRank(column))
            .map((column) => {
              const Icon = PROPERTY_ICONS[column.type]
              return (
                <div key={column.name} className="contents">
                  <dt className="flex h-8 items-center gap-1.5 text-muted-foreground">
                    <Icon className="size-4" />
                    {column.name.replace(/_/g, ' ')}
                  </dt>
                  <dd className="flex min-h-8 items-center [&>.wsx-tokens]:flex-1">
                    <PaperSurface>
                      <DatabaseCell
                        db={db}
                        column={column}
                        value={row[column.name]}
                        commit={(value) => void save(column.name, value)}
                      />
                    </PaperSurface>
                  </dd>
                </div>
              )
            })}
        </dl>
      </PaperProvider>
    </div>
  )
}
