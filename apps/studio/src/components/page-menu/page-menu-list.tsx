import {
  IconArrowsHorizontal,
  IconCode,
  IconCopy,
  IconCornerDownRight,
  IconCursorText,
  IconPalette,
  IconTrash,
} from '@tabler/icons-react'
import { useSheetsStore } from '@washi/ui'
import { useEditorStore } from '@/components/page-editor'
import type { PageMenuListProps } from './lib'
import { PageMenuQuick } from './page-menu-quick'

const ITEM =
  'flex h-8 w-full items-center gap-2.5 rounded-lg px-2 text-left text-[13px] hover:bg-accent'

export function PageMenuList({ sheet, onMode, onDone, compact }: PageMenuListProps) {
  const store = useSheetsStore.getState

  return (
    <div className="p-1">
      {compact && <PageMenuQuick sheet={sheet} onMode={onMode} onDone={onDone} />}
      <button type="button" onClick={() => onMode('rename')} className={ITEM}>
        <IconCursorText className="size-4 text-muted-foreground" />
        Rename
      </button>
      <button
        type="button"
        role="switch"
        aria-checked={sheet.fullWidth}
        onClick={() => void store().updateMeta(sheet.id, { fullWidth: !sheet.fullWidth })}
        className={ITEM}
      >
        <IconArrowsHorizontal className="size-4 text-muted-foreground" />
        <span className="flex-1">Full width</span>
        <span
          className={`flex h-4 w-7 items-center rounded-full p-0.5 transition-colors ${
            sheet.fullWidth ? 'bg-primary' : 'bg-border'
          }`}
        >
          <span
            className={`size-3 rounded-full bg-white transition-transform ${
              sheet.fullWidth ? 'translate-x-3' : ''
            }`}
          />
        </span>
      </button>
      <button type="button" onClick={() => onMode('theme')} className={ITEM}>
        <IconPalette className="size-4 text-muted-foreground" />
        Theme
      </button>
      <button
        type="button"
        onClick={() => {
          void store().duplicateSheet(sheet.id)
          onDone()
        }}
        className={ITEM}
      >
        <IconCopy className="size-4 text-muted-foreground" />
        Duplicate
      </button>
      <button type="button" onClick={() => onMode('move')} className={ITEM}>
        <IconCornerDownRight className="size-4 text-muted-foreground" />
        Move to…
      </button>
      <button
        type="button"
        onClick={() => {
          useEditorStore.getState().startEditing(sheet.id, false, 'source')
          onDone()
        }}
        className={ITEM}
      >
        <IconCode className="size-4 text-muted-foreground" />
        Edit source
      </button>
      <div className="my-1 h-px bg-border" />
      <button
        type="button"
        onClick={() => {
          void store().deleteSheet(sheet.id)
          onDone()
        }}
        className={`${ITEM} text-destructive`}
      >
        <IconTrash className="size-4" />
        Move to Trash
      </button>
    </div>
  )
}
