import { IconCheck, IconPencil } from '@tabler/icons-react'
import { noteIdOf, useSheetsStore, useViewStore } from '@washi/ui'
import { useEditorStore } from '@/components/page-editor'
import { AskField } from '../ask-field'

const stay = () => {}

/** The ask field where the thumb lives. ✎ is a new page on Home and Edit · Done on a page. */
export function AskBar() {
  const pageId = useViewStore((state) => noteIdOf(state.activeTab))
  const isEditing = useEditorStore((state) => pageId !== null && state.editingId === pageId)
  const label = pageId ? (isEditing ? 'Done editing' : 'Edit this page') : 'New page'

  const onPen = () => {
    if (!pageId) return void useSheetsStore.getState().createSheet()
    if (isEditing) useEditorStore.getState().stopEditing()
    else useEditorStore.getState().startEditing(pageId)
  }

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 flex items-center gap-2 border-border border-t bg-muted/95 px-3 pt-2 pb-[max(8px,env(safe-area-inset-bottom))] backdrop-blur">
      <div className="min-w-0 flex-1">
        <AskField onNavigate={stay} scoped={pageId !== null} />
      </div>
      <button
        type="button"
        onClick={onPen}
        aria-label={label}
        title={label}
        className={`grid size-11 shrink-0 place-items-center rounded-[9px] border ${
          isEditing
            ? 'border-primary bg-primary text-primary-foreground'
            : 'border-border bg-card text-muted-foreground'
        }`}
      >
        {isEditing ? <IconCheck className="size-[18px]" /> : <IconPencil className="size-[18px]" />}
      </button>
    </div>
  )
}
