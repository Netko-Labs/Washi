import { IconClock } from '@tabler/icons-react'
import { Link } from '@tanstack/react-router'
import { relativeTime } from '@washi/ui'
import { type ChatRowProps, chatPath } from './lib'

export function ChatsRow({ workspaceId, chat, isRoutine, isWaiting }: ChatRowProps) {
  return (
    <li>
      <Link
        to={chatPath(workspaceId, chat.id)}
        className="flex h-11 items-center gap-3 rounded-lg px-3 text-[13.5px] hover:bg-accent"
      >
        {isRoutine && (
          <IconClock aria-label="Routine run" className="size-4 shrink-0 text-muted-foreground" />
        )}
        <span className="min-w-0 flex-1 truncate">{chat.title}</span>
        {chat.status === 'running' && (
          <span className="size-2 shrink-0 rounded-full bg-primary" title="Washi is working" />
        )}
        {isWaiting && (
          <span className="shrink-0 rounded-full bg-primary/12 px-2 py-0.5 font-medium text-[11px] text-primary">
            Waiting on you
          </span>
        )}
        <span className="shrink-0 text-[12px] text-muted-foreground">
          {relativeTime(chat.updatedAt)}
        </span>
      </Link>
    </li>
  )
}
