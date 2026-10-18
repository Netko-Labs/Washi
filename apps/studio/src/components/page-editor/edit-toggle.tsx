import { IconCheck, IconCode, IconPencil } from '@tabler/icons-react'
import { type EditToggleProps, SAVE_LABELS, useEditorStore } from './lib'

export function EditToggle({ sheetId }: EditToggleProps) {
  const isEditing = useEditorStore((state) => state.editingId === sheetId)
  const saveState = useEditorStore((state) => state.saveState)
  const mode = useEditorStore((state) => state.mode)
  const store = useEditorStore.getState
  // Leaving a source with errors would drop it: it never saved.
  const isHeld = isEditing && saveState === 'invalid'

  return (
    <>
      {isEditing && (
        <span
          role="status"
          className={`hidden text-[12px] sm:inline ${saveState === 'failed' || isHeld ? 'text-destructive' : 'text-muted-foreground'}`}
        >
          {SAVE_LABELS[saveState]}
        </span>
      )}
      {isEditing && (
        <button
          type="button"
          aria-label="Edit the source"
          aria-pressed={mode === 'source'}
          title={mode === 'source' ? 'Back to blocks' : 'Edit the source'}
          disabled={isHeld}
          onClick={() => store().setMode(mode === 'source' ? 'blocks' : 'source')}
          className={`flex size-8 items-center justify-center rounded-lg disabled:opacity-50 ${
            mode === 'source'
              ? 'bg-accent text-foreground'
              : 'border border-border bg-background text-muted-foreground hover:bg-accent'
          }`}
        >
          <IconCode className="size-4" />
        </button>
      )}
      <button
        type="button"
        disabled={isHeld}
        title={isHeld ? 'Fix the errors to save first' : undefined}
        onClick={() => (isEditing ? store().stopEditing() : store().startEditing(sheetId))}
        className={`flex h-8 items-center gap-1.5 rounded-lg px-2.5 font-medium text-[12.5px] disabled:opacity-50 ${
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
