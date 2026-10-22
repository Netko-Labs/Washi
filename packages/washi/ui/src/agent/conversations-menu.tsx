import { IconCheck, IconDots, IconPencil, IconPlus, IconTrash } from '@tabler/icons-react'
import { useState } from 'react'
import { useAgentStore } from '../stores'
import type { ConversationRowState, ConversationsMenuProps } from './lib'

const ROW =
  'group/row flex w-full items-center gap-2 rounded-lg px-2 py-[7px] text-left text-[12.5px] hover:bg-accent'

/** Every conversation, newest first: pick one, rename it inline, or delete it with one in-row confirmation. */
export function ConversationsMenu({ onClose }: ConversationsMenuProps) {
  const sessions = useAgentStore((state) => state.sessions)
  const activeSessionId = useAgentStore((state) => state.activeSessionId)
  const [row, setRow] = useState<ConversationRowState>({ renamingId: null, confirmingId: null })
  const store = useAgentStore.getState

  const rename = (id: string, title: string) => {
    setRow({ renamingId: null, confirmingId: null })
    if (title.trim()) void store().renameSession(id, title)
  }

  return (
    <div className="absolute top-12 left-3 z-[60] w-[300px] rounded-xl border border-border bg-popover p-[5px] shadow-[0_8px_28px_rgb(0_0_0/0.16)]">
      <div className="px-2 pt-1.5 pb-1 font-semibold text-[10.5px] text-muted-foreground uppercase tracking-[0.06em]">
        Conversations
      </div>
      <div className="max-h-[320px] overflow-y-auto">
        {sessions.map((session) =>
          row.renamingId === session.id ? (
            <form
              key={session.id}
              className="px-2 py-1"
              onSubmit={(event) => {
                event.preventDefault()
                rename(session.id, new FormData(event.currentTarget).get('title') as string)
              }}
            >
              <input
                name="title"
                defaultValue={session.title}
                ref={(node) => node?.select()}
                onKeyDown={(event) => {
                  if (event.key === 'Escape') setRow({ renamingId: null, confirmingId: null })
                }}
                onBlur={(event) => rename(session.id, event.target.value)}
                aria-label="Conversation title"
                className="h-7 w-full rounded-md border border-primary bg-card px-1.5 text-[12.5px] outline-none"
              />
            </form>
          ) : row.confirmingId === session.id ? (
            <div
              key={session.id}
              className="flex items-center gap-2 px-2 py-[7px] text-[12.5px] text-muted-foreground"
            >
              <span className="min-w-0 flex-1 truncate">
                Delete <span className="font-semibold text-destructive">{session.title}</span>?
              </span>
              <button
                type="button"
                onClick={() => {
                  setRow({ renamingId: null, confirmingId: null })
                  void store().deleteSession(session.id)
                }}
                className="h-6 rounded-md bg-destructive px-2 text-[11.5px] text-white"
              >
                Delete
              </button>
              <button
                type="button"
                onClick={() => setRow({ renamingId: null, confirmingId: null })}
                className="h-6 rounded-md border border-border px-2 text-[11.5px] text-foreground"
              >
                Keep
              </button>
            </div>
          ) : (
            <div key={session.id} className={ROW}>
              <button
                type="button"
                onClick={() => {
                  void store().selectSession(session.id)
                  onClose()
                }}
                className="min-w-0 flex-1 truncate text-left font-medium"
              >
                {session.title}
              </button>
              {session.id === activeSessionId && <IconCheck className="size-[13px] shrink-0" />}
              <span className="hidden shrink-0 items-center group-focus-within/row:flex group-hover/row:flex">
                <button
                  type="button"
                  aria-label={`Rename ${session.title}`}
                  title="Rename"
                  onClick={() => setRow({ renamingId: session.id, confirmingId: null })}
                  className="grid size-6 place-items-center rounded text-muted-foreground hover:text-foreground"
                >
                  <IconPencil className="size-3.5" />
                </button>
                <button
                  type="button"
                  aria-label={`Delete ${session.title}`}
                  title="Delete"
                  onClick={() => setRow({ renamingId: null, confirmingId: session.id })}
                  className="grid size-6 place-items-center rounded text-muted-foreground hover:text-destructive"
                >
                  <IconTrash className="size-3.5" />
                </button>
              </span>
              <IconDots className="size-3.5 shrink-0 text-muted-foreground group-focus-within/row:hidden group-hover/row:hidden" />
            </div>
          ),
        )}
      </div>
      <div className="mx-1 my-1 h-px bg-border" />
      <button
        type="button"
        onClick={() => {
          void store().createSession()
          onClose()
        }}
        className="flex w-full items-center gap-2 rounded-lg px-2 py-[7px] text-left text-[12.5px] text-muted-foreground hover:bg-accent"
      >
        <IconPlus className="size-[13px]" />
        New conversation
      </button>
    </div>
  )
}
