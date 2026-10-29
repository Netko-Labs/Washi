import { type AddPropertyProps, usePropertyPopover } from './lib'
import { PropertyPanel } from './property-panel'

/** The header's "+": a small panel to name a property and pick its type, the way Notion asks. */
export function AddProperty({ onAdd, taken }: AddPropertyProps) {
  const popover = usePropertyPopover()

  return (
    <>
      <button
        ref={popover.button}
        type="button"
        className="wsx-db-plus"
        aria-label="Add a property"
        aria-expanded={popover.open}
        title="Add a property"
        onClick={() => (popover.open ? popover.hide() : popover.show())}
      >
        <svg viewBox="0 0 16 16" aria-hidden>
          <path d="M8 3.5v9M3.5 8h9" />
        </svg>
      </button>
      <div ref={popover.panel} popover="auto" className="wsx-db-pop" onToggle={popover.onToggle}>
        {popover.open && <PropertyPanel onAdd={onAdd} taken={taken} onDone={popover.hide} />}
      </div>
    </>
  )
}
