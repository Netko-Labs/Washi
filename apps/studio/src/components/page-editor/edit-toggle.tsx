import { IconCheck, IconPencil } from '@tabler/icons-react'
import { type EditToggleProps, SAVE_LABELS, useEditorStore } from './lib'

export function EditToggle({ sheetId }: EditToggleProps) {
  const isEditing = useEditorStore((state) => state.editingId === sheetId)
  const saveState = useEditorStore((state) => state.saveState)
  const store = useEditorStore.getState

  return (
    <>
      {isEditing && (
        <span
          role="status"
          className={`hidden text-[12px] sm:inline ${saveState === 'failed' ? 'text-destructive' : 'text-muted-foreground'}`}
        >
          {SAVE_LABELS[saveState]}
        </span>
      )}
      <button
        type="button"
        onClick={() => (isEditing ? store().stopEditing() : store().startEditing(sheetId))}
        className={`flex h-8 items-center gap-1.5 rounded-lg px-2.5 font-medium text-[12.5px] ${
          isEditing
            ? 'bg-primary text-primary-foreground'
            : 'border border-border bg-background hover:bg-accent'
        }`}
      >
        {isEditing ? <IconCheck className="size-3.5" /> : <IconPencil className="size-3.5" />}
        {isEditing ? 'Done' : 'Edit'}
      </button>
    </>
  )
}
