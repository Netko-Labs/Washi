import { IconChevronLeft, IconDots, IconPencil, IconTrash } from '@tabler/icons-react'
import { Link } from '@tanstack/react-router'
import { Floating } from '@/components/shared/floating'
import { type ChatBarProps, useChatBar } from './lib'

/** A stable ref callback: React runs it on mount only, so the title is selected once. */
const selectOnMount = (node: HTMLInputElement | null) => node?.select()

const ICON_BUTTON =
  'grid size-11 shrink-0 place-items-center rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground md:size-8'
const ROW =
  'flex h-11 w-full items-center gap-2.5 rounded-lg px-2 text-left text-[13px] hover:bg-accent disabled:opacity-50 md:h-8'

/** The chat's name, renamed in place, and ⋯ for Rename and Delete. A new chat has neither yet. */
export function ChatBar({ workspaceId, chatId }: ChatBarProps) {
  const bar = useChatBar(workspaceId, chatId)
  const { session } = bar

  return (
    <div className="flex h-12 shrink-0 items-center gap-1 px-1 sm:px-3">
      <Link
        to="/w/$workspaceId/chats"
        params={{ workspaceId }}
        aria-label="All chats"
        title="All chats"
        className={ICON_BUTTON}
      >
        <IconChevronLeft className="size-[18px]" />
      </Link>
      {session && bar.mode === 'renaming' ? (
        <form
          className="min-w-0 flex-1"
          onSubmit={(event) => {
            event.preventDefault()
            bar.rename(new FormData(event.currentTarget).get('title') as string)
          }}
        >
          <input
            name="title"
            defaultValue={session.title}
            ref={selectOnMount}
            onKeyDown={(event) => {
              if (event.key === 'Escape') bar.setMode('idle')
            }}
            onBlur={(event) => bar.rename(event.target.value)}
            aria-label="Chat title"
            className="h-9 w-full max-w-md rounded-lg border border-ring bg-card px-2 font-medium text-[16px] outline-none md:text-[14px]"
          />
        </form>
      ) : (
        <button
          type="button"
          disabled={!session}
          onClick={() => bar.setMode('renaming')}
          title={session ? 'Rename' : undefined}
          className="h-9 min-w-0 truncate rounded-lg px-2 text-left font-medium text-[14px] enabled:hover:bg-accent"
        >
          {session?.title ?? 'New chat'}
        </button>
      )}
      {session && (
        <div ref={bar.menuRef} className="ml-auto">
          <button
            type="button"
            aria-label="Chat options"
            aria-haspopup="menu"
            aria-expanded={bar.isMenuOpen}
            onClick={() => bar.setMode(bar.isMenuOpen ? 'idle' : 'menu')}
            className={ICON_BUTTON}
          >
            <IconDots className="size-[18px]" />
          </button>
          {bar.isMenuOpen && (
            <Floating
              anchor={bar.menuRef}
              side="bottom"
              align="end"
              role="menu"
              className="w-[230px] rounded-xl border border-border bg-popover p-1.5 text-popover-foreground shadow-[0_16px_48px_rgb(0_0_0/0.22)]"
            >
              {bar.mode === 'confirming' ? (
                <div className="p-1.5">
                  <p className="mb-2 text-[13px]">
                    Delete <span className="font-semibold">{session.title}</span>?
                  </p>
                  <div className="flex gap-1.5">
                    <button
                      type="button"
                      onClick={bar.remove}
                      className="h-11 flex-1 rounded-lg bg-destructive px-2 text-[13px] text-white md:h-8"
                    >
                      Delete
                    </button>
                    <button
                      type="button"
                      onClick={() => bar.setMode('idle')}
                      className="h-11 flex-1 rounded-lg border border-border px-2 text-[13px] md:h-8"
                    >
                      Keep
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => bar.setMode('renaming')}
                    className={ROW}
                  >
                    <IconPencil className="size-4" />
                    Rename
                  </button>
                  <button
                    type="button"
                    role="menuitem"
                    disabled={bar.running}
                    title={bar.running ? 'Stop the turn first' : undefined}
                    onClick={() => bar.setMode('confirming')}
                    className={`${ROW} text-destructive`}
                  >
                    <IconTrash className="size-4" />
                    Delete
                  </button>
                </>
              )}
            </Floating>
          )}
        </div>
      )}
    </div>
  )
}
