import { Link } from '@tanstack/react-router'
import { relativeTime } from '@washi/ui'
import { type ChatsSearchResultsProps, chatPath, snippetParts } from './lib'

export function ChatsSearchResults({ workspaceId, hits }: ChatsSearchResultsProps) {
  if (hits.length === 0) {
    return <p className="mt-10 text-center text-[13px] text-muted-foreground">No chat says that.</p>
  }
  return (
    <ul className="mt-4 space-y-px">
      {hits.map((hit) => (
        <li key={hit.sessionId}>
          <Link
            to={chatPath(workspaceId, hit.sessionId)}
            className="block rounded-lg px-3 py-2.5 hover:bg-accent"
          >
            <span className="flex items-center gap-3 text-[13.5px]">
              <span className="min-w-0 flex-1 truncate font-medium">{hit.title}</span>
              <span className="shrink-0 text-[12px] text-muted-foreground">
                {relativeTime(hit.updatedAt)}
              </span>
            </span>
            {hit.snippet && (
              <span className="mt-0.5 line-clamp-2 block text-[12.5px] text-muted-foreground">
                {snippetParts(hit.snippet).map((part, index) =>
                  part.isHit ? (
                    <mark key={index} className="rounded-sm bg-primary/15 px-0.5 text-foreground">
                      {part.text}
                    </mark>
                  ) : (
                    part.text
                  ),
                )}
              </span>
            )}
          </Link>
        </li>
      ))}
    </ul>
  )
}
