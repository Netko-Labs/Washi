import { useSheetsStore } from '@washi/ui'
import { useState } from 'react'
import type { PageMenuPanelProps } from './lib'

export function RenameForm({ sheet, onDone }: PageMenuPanelProps) {
  const [title, setTitle] = useState(sheet.title)

  return (
    <form
      className="flex gap-1.5 p-1"
      onSubmit={(event) => {
        event.preventDefault()
        const next = title.trim()
        if (next && next !== sheet.title) {
          void useSheetsStore.getState().updateMeta(sheet.id, { title: next })
        }
        onDone()
      }}
    >
      <input
        ref={(node) => node?.focus()}
        value={title}
        maxLength={200}
        onChange={(event) => setTitle(event.target.value)}
        aria-label="Page name"
        className="h-8 min-w-0 flex-1 rounded-lg border border-border bg-background px-2.5 text-[13px] outline-none focus-visible:border-primary"
      />
      <button
        type="submit"
        disabled={!title.trim()}
        className="h-8 shrink-0 rounded-lg bg-primary px-3 font-semibold text-[12.5px] text-primary-foreground disabled:opacity-50"
      >
        Rename
      </button>
    </form>
  )
}
