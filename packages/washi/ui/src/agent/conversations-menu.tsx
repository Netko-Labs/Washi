import {
  IconCheck,
  IconDots,
  IconMessageForward,
  IconPencil,
  IconPlus,
  IconTrash,
} from '@tabler/icons-react'
import { useState } from 'react'
import { useShallow } from 'zustand/react/shallow'
import { isInScope, shownScope, useAgentStore, useNoticeStore } from '../stores'
import type { ConversationRowState, ConversationsMenuProps } from './lib'
import { MovePicker } from './move-picker'

const ROW =
  'group/row flex w-full items-center gap-2 rounded-lg px-2 py-[7px] text-left text-[12.5px] hover:bg-accent'

const MENU =
  'absolute top-12 left-3 z-[60] w-[300px] rounded-xl border border-border bg-popover p-[5px] shadow-[0_8px_28px_rgb(0_0_0/0.16)]'

const RESTING: ConversationRowState = { renamingId: null, confirmingId: null, isPicking: false }

/**
 * This place's conversations, newest first (D110): pick one, rename it inline, delete it with one
 * in-row confirmation, start one here, or move the one on screen to another page.
 */
export function ConversationsMenu({ onClose }: ConversationsMenuProps) {
  const { sessions, activeSessionId, scope } = useAgentStore(
    useShallow((state) => ({
      sessions: state.sessions,
      activeSessionId: state.activeSessionId,
      scope: shownScope(state),
    })),
  )
  const [row, setRow] = useState<ConversationRowState>(RESTING)
  const store = useAgentStore.getState
  const here = sessions.filter((session) => isInScope(session, scope))
  const movable = here.some((session) => session.id === activeSessionId) ? activeSessionId : null

  const rename = (id: string, title: string) => {
    setRow(RESTING)
    if (title.trim()) void store().renameSession(id, title)
  }

  if (row.isPicking && movable) {
    return (
      <div className={MENU}>
        <MovePicker
          current={scope}
          onPick={(sheetId) => {
            onClose()
            store()
              .moveSession(movable, sheetId)
              .catch((cause: unknown) =>
                useNoticeStore
                  .getState()
                  .say(
                    `That chat did not move — ${cause instanceof Error ? cause.message : cause}`,
                  ),
              )
          }}
        />
      </div>
    )
  }

  return (
    <div className={MENU}>
      <div className="px-2 pt-1.5 pb-1 font-semibold text-[10.5px] text-muted-foreground uppercase tracking-[0.06em]">
        {scope ? 'On this page' : 'At home'}
      </div>
      <div className="max-h-[320px] overflow-y-auto">
        {here.length === 0 && (
          <p className="px-2 py-2 text-[12px] text-muted-foreground">No conversations here yet.</p>
        )}
        {here.map((session) =>
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
                  if (event.key === 'Escape') setRow(RESTING)
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
                  setRow(RESTING)
                  void store().deleteSession(session.id)
                }}
                className="h-6 rounded-md bg-destructive px-2 text-[11.5px] text-destructive-foreground"
              >
                Delete
              </button>
              <button
                type="button"
                onClick={() => setRow(RESTING)}
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
                  onClick={() => setRow({ ...RESTING, renamingId: session.id })}
                  className="grid size-6 place-items-center rounded text-muted-foreground hover:text-foreground"
                >
                  <IconPencil className="size-3.5" />
                </button>
                <button
                  type="button"
                  aria-label={`Delete ${session.title}`}
                  title="Delete"
                  onClick={() => setRow({ ...RESTING, confirmingId: session.id })}
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
          store().startDraft()
          onClose()
        }}
        className={`${ROW} text-muted-foreground`}
      >
        <IconPlus className="size-[13px]" />
        New chat here
      </button>
      {movable && (
        <button
          type="button"
          onClick={() => setRow({ ...RESTING, isPicking: true })}
          className={`${ROW} text-muted-foreground`}
        >
          <IconMessageForward className="size-[13px]" />
          Move to page…
        </button>
      )}
    </div>
  )
}
