import { IconArrowBackUp, IconSparkles } from '@tabler/icons-react'
import { relativeTime, useSheetsStore } from '@washi/ui'
import type { WashiMarkProps } from './lib'

/** Washi's writes land without asking, so the page says when the last one was Washi's. */
export function WashiMark({ sheet }: WashiMarkProps) {
  if (sheet.editedBy !== 'washi') return null
  return (
    <div className="absolute top-2 right-8 flex items-center gap-1.5 text-[12px] text-muted-foreground">
      <IconSparkles className="size-3.5 text-agent" />
      <span>Washi wrote this {relativeTime(sheet.hlcUpdated)}</span>
      {sheet.undoable && (
        <button
          type="button"
          onClick={() => void useSheetsStore.getState().undoWashi(sheet.id)}
          className="ml-1 flex h-6 items-center gap-1 rounded-md px-1.5 hover:bg-accent hover:text-foreground"
        >
          <IconArrowBackUp className="size-3.5" />
          Undo
        </button>
      )}
    </div>
  )
}
