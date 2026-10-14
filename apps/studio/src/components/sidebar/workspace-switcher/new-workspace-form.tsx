import { IconPlus } from '@tabler/icons-react'
import { useState } from 'react'
import type { NewWorkspaceFormProps } from './lib'

export function NewWorkspaceForm({ error, onCreate }: NewWorkspaceFormProps) {
  const [isEditing, setEditing] = useState(false)
  const [name, setName] = useState('')
  const [isBusy, setBusy] = useState(false)

  if (!isEditing) {
    return (
      <button
        type="button"
        onClick={() => setEditing(true)}
        className="flex h-8 w-full items-center gap-2.5 rounded-lg px-2 text-left text-[13px] text-muted-foreground hover:bg-accent"
      >
        <IconPlus className="size-[15px]" />
        New workspace
      </button>
    )
  }

  return (
    <form
      className="space-y-1.5 px-1 pt-0.5 pb-1.5"
      onSubmit={(event) => {
        event.preventDefault()
        if (!name.trim()) return
        setBusy(true)
        void onCreate(name.trim()).finally(() => setBusy(false))
      }}
    >
      <div className="flex gap-1.5">
        <input
          ref={(node) => node?.focus()}
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Workspace name"
          aria-label="Workspace name"
          className="h-8 min-w-0 flex-1 rounded-lg border border-border bg-background px-2.5 text-[13px] outline-none focus-visible:border-primary"
        />
        <button
          type="submit"
          disabled={isBusy || !name.trim()}
          className="h-8 shrink-0 rounded-lg bg-primary px-3 font-semibold text-[12.5px] text-primary-foreground disabled:opacity-50"
        >
          Create
        </button>
      </div>
      {error && <p className="px-1 text-[12px] text-destructive">{error}</p>}
    </form>
  )
}
