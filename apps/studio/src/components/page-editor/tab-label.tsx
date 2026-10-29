import { type DragEvent, useState } from 'react'
import { MAX_TAB_LABEL, type TabLabelProps, useEditorStore } from './lib'
import { TabMenu } from './tab-menu'

const takeCaret = (field: HTMLInputElement | null) => {
  field?.focus()
  field?.select()
}

/** One tab in the strip: a press shows it, a double press renames it, a block dropped on it moves in. */
export function TabLabel({ tabsId, tab, isActive }: TabLabelProps) {
  const [isRenaming, setRenaming] = useState(false)
  const store = useEditorStore.getState

  const onDragOver = (event: DragEvent<HTMLElement>) => {
    const { dragging } = store()
    if (!dragging || dragging === tabsId) return
    event.preventDefault()
    event.stopPropagation()
    event.dataTransfer.dropEffect = 'move'
    store().setDrop(null)
    if (!isActive) store().showTab(tabsId, tab.id)
  }
  const onDrop = (event: DragEvent<HTMLElement>) => {
    const { dragging } = store()
    const last = tab.blocks.at(-1)
    if (!dragging || !last) return
    event.preventDefault()
    event.stopPropagation()
    store().moveTo(dragging, last.id, 'after')
  }

  if (isRenaming) {
    return (
      <input
        ref={takeCaret}
        defaultValue={tab.label}
        maxLength={MAX_TAB_LABEL}
        aria-label="Tab name"
        onBlur={(event) => {
          store().renameTab(tabsId, tab.id, event.currentTarget.value)
          setRenaming(false)
        }}
        onKeyDown={(event) => {
          if (event.key === 'Escape') event.currentTarget.value = tab.label
          if (event.key === 'Enter' || event.key === 'Escape') event.currentTarget.blur()
        }}
        className="wsx-tabs-tab w-32 shrink-0 bg-transparent text-[var(--ink)] outline-none"
      />
    )
  }

  return (
    <div className="group/tab flex shrink-0 items-center">
      <button
        type="button"
        role="tab"
        aria-selected={isActive}
        className="wsx-tabs-tab"
        onClick={() => store().showTab(tabsId, tab.id)}
        onDoubleClick={() => setRenaming(true)}
        onDragOver={onDragOver}
        onDrop={onDrop}
      >
        {tab.label}
      </button>
      <TabMenu tabsId={tabsId} tabId={tab.id} onRename={() => setRenaming(true)} />
    </div>
  )
}
