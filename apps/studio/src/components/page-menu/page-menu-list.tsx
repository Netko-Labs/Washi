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
import { SHEET_ROW } from '@/components/shared/bottom-sheet'
import type { PageMenuListProps } from './lib'
import { PageMenuQuick } from './page-menu-quick'

const ROW =
  'flex h-8 w-full items-center gap-2.5 rounded-lg px-2 text-left text-[13px] hover:bg-accent'

/** A phone's list has no Full width: a page there is already as wide as the screen. */
export function PageMenuList({ sheet, onMode, onDone, compact }: PageMenuListProps) {
  const store = useSheetsStore.getState
  const item = compact ? SHEET_ROW : ROW
  const role = compact ? undefined : 'menuitem'

  const items = (
    <>
      {compact && <PageMenuQuick sheet={sheet} onMode={onMode} onDone={onDone} />}
      <button type="button" role={role} onClick={() => onMode('rename')} className={item}>
        <IconCursorText className="size-4 text-muted-foreground" />
        Rename
      </button>
      {!compact && (
        <button
          type="button"
          role="menuitemcheckbox"
          aria-checked={sheet.fullWidth}
          onClick={() => void store().updateMeta(sheet.id, { fullWidth: !sheet.fullWidth })}
          className={item}
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
      )}
      <button type="button" role={role} onClick={() => onMode('theme')} className={item}>
        <IconPalette className="size-4 text-muted-foreground" />
        Theme
      </button>
      <button
        type="button"
        role={role}
        onClick={() => {
          void store().duplicateSheet(sheet.id)
          onDone()
        }}
        className={item}
      >
        <IconCopy className="size-4 text-muted-foreground" />
        Duplicate
      </button>
      <button type="button" role={role} onClick={() => onMode('move')} className={item}>
        <IconCornerDownRight className="size-4 text-muted-foreground" />
        Move to…
      </button>
      <button
        type="button"
        role={role}
        onClick={() => {
          useEditorStore.getState().startEditing(sheet.id, false, 'source')
          onDone()
        }}
        className={item}
      >
        <IconCode className="size-4 text-muted-foreground" />
        Edit source
      </button>
      <hr className="my-1 border-border" />
      <button
        type="button"
        role={role}
        onClick={() => {
          void store().deleteSheet(sheet.id)
          onDone()
        }}
        className={`${item} text-destructive`}
      >
        <IconTrash className="size-4" />
        Move to Trash
      </button>
    </>
  )

  return compact ? (
    <div className="p-1">{items}</div>
  ) : (
    <div role="menu" aria-label="Page options" className="p-1">
      {items}
    </div>
  )
}
