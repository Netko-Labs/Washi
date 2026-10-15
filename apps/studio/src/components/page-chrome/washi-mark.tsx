import { IconArrowBackUp, IconSparkles } from '@tabler/icons-react'
import { relativeTime, useSheetsStore } from '@washi/ui'
import { useState } from 'react'
import type { WashiMarkProps } from './lib'

/** Washi's writes land without asking, so the page says when the last one was Washi's. */
export function WashiMark({ sheet }: WashiMarkProps) {
  const [failed, setFailed] = useState(false)
  if (sheet.editedBy !== 'washi') return null

  const undo = () => {
    setFailed(false)
    useSheetsStore
      .getState()
      .undoWashi(sheet.id)
      .catch(() => setFailed(true))
  }

  return (
    <div className="flex items-center gap-1.5 text-[12px] text-muted-foreground">
      <IconSparkles className="size-3.5 text-agent" />
      <span>
        {failed
          ? 'Could not undo — the page changed since.'
          : `Washi wrote this ${relativeTime(sheet.hlcUpdated)}`}
      </span>
      {sheet.undoable && !failed && (
        <button
          type="button"
          onClick={undo}
          className="ml-1 flex h-6 items-center gap-1 rounded-md px-1.5 hover:bg-accent hover:text-foreground"
        >
          <IconArrowBackUp className="size-3.5" />
          Undo
        </button>
      )}
    </div>
  )
}
