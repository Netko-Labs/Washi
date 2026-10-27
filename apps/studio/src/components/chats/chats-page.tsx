import { IconPlus } from '@tabler/icons-react'
import { Link } from '@tanstack/react-router'
import { Mascot } from '@washi/ui'
import { ChatsRow } from './chats-row'
import { ChatsSearchResults } from './chats-search-results'
import { CHAT_FILTERS, type ChatsPageProps, chatPath, useChatList } from './lib'

/** Every chat you can read, by day (D67); search reads what was said, not only titles. */
export function ChatsPage({ workspaceId }: ChatsPageProps) {
  const { groups, hits, term, setTerm, filter, setFilter, routineChats, waiting } = useChatList()

  return (
    <div className="min-h-0 flex-1 overflow-y-auto overscroll-y-none">
      <div className="mx-auto w-full max-w-[760px] px-6 py-10">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h1 className="font-semibold text-[26px] tracking-[-0.02em]">Chats</h1>
            <p className="mt-1 text-[13.5px] text-muted-foreground leading-relaxed">
              Your conversations with Washi, and the ones its routines had.
            </p>
          </div>
          <Link
            to={chatPath(workspaceId)}
            className="flex h-9 shrink-0 items-center gap-1.5 rounded-lg bg-primary px-3 font-medium text-[13px] text-primary-foreground hover:bg-primary/90"
          >
            <IconPlus className="size-4" />
            New chat
          </Link>
        </div>

        <input
          value={term}
          onChange={(event) => setTerm(event.target.value)}
          placeholder="Search everything said in your chats…"
          aria-label="Search chats"
          className="mt-6 h-9 w-full rounded-lg border border-border bg-card px-3 text-[13px] outline-none focus-visible:border-primary"
        />

        {hits ? (
          <ChatsSearchResults workspaceId={workspaceId} hits={hits} />
        ) : (
          <>
            <div className="mt-3 flex gap-1.5" role="tablist" aria-label="Show">
              {CHAT_FILTERS.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  role="tab"
                  aria-selected={filter === option.id}
                  onClick={() => setFilter(option.id)}
                  className={`h-7 rounded-full border px-3 text-[12px] ${
                    filter === option.id
                      ? 'border-foreground bg-foreground text-background'
                      : 'border-border text-muted-foreground hover:bg-accent'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>

            {groups.length === 0 && (
              <div className="mt-16 flex flex-col items-center gap-3 text-center">
                <Mascot face="curious" motion="breathe" size={72} className="mascot-motion" />
                <p className="font-serif text-[19px] italic">
                  {filter === 'all' ? 'No chats yet' : 'Nothing here'}
                </p>
                <p className="max-w-64 text-[13px] text-muted-foreground">
                  Ask Washi anything; every conversation lands here, newest first.
                </p>
              </div>
            )}

            {groups.map((group) => (
              <section key={group.label} className="mt-6">
                <h2 className="px-3 font-medium text-[11.5px] text-muted-foreground uppercase tracking-[0.06em]">
                  {group.label}
                </h2>
                <ul className="mt-1.5 space-y-px">
                  {group.chats.map((chat) => (
                    <ChatsRow
                      key={chat.id}
                      workspaceId={workspaceId}
                      chat={chat}
                      isRoutine={routineChats.has(chat.id)}
                      isWaiting={waiting.has(chat.id)}
                    />
                  ))}
                </ul>
              </section>
            ))}
          </>
        )}
      </div>
    </div>
  )
}
