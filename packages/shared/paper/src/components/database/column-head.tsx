import { ColumnMenu } from './column-menu'
import { type ColumnHeadProps, tableLabel, usePropertyPopover } from './lib'
import { PropertyIcon } from './property-icon'

/** A column's head is a button: pressed, it opens the property's menu, as Notion's does. */
export function ColumnHead(props: ColumnHeadProps) {
  const { column, local } = props
  const popover = usePropertyPopover('start')
  const sorted = local.sort?.column === column.name ? local.sort.direction : null

  return (
    <>
      <button
        ref={popover.button}
        type="button"
        className="wsx-db-th"
        aria-haspopup="menu"
        aria-expanded={popover.open}
        onClick={() => (popover.open ? popover.hide() : popover.show())}
      >
        <PropertyIcon type={column.type} />
        {tableLabel(column.name)}
        {sorted && (
          <span className="wsx-db-sorted" aria-hidden>
            {sorted === 'asc' ? '↑' : '↓'}
          </span>
        )}
      </button>
      <div ref={popover.panel} popover="auto" className="wsx-db-pop" onToggle={popover.onToggle}>
        {popover.open && <ColumnMenu {...props} onDone={popover.hide} />}
      </div>
    </>
  )
}
