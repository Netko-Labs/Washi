import { IconChevronDown, IconInbox } from '@tabler/icons-react'
import { useState } from 'react'
import { type PageSuggestionsProps, usePageSuggestions } from './lib'
import { PageSuggestionRow } from './page-suggestion-row'

/**
 * Requests visitors sent through this page's link, on the page itself (D129) — not only in the
 * Inbox, where a busy week buries them. Approve lands the row as the member's own (P1); Decline
 * keeps nothing. Nothing waiting draws nothing (P3).
 */
export function PageSuggestions({ sheetId }: PageSuggestionsProps) {
  const waiting = usePageSuggestions(sheetId)
  const [isFolded, setFolded] = useState(false)
  if (waiting.length === 0) return null
  const count = waiting.length

  return (
    <section
      aria-label="Requests from the shared link"
      className="mt-3 rounded-xl border border-border bg-muted/50 px-3 py-2 font-sans"
    >
      <button
        type="button"
        aria-expanded={!isFolded}
        onClick={() => setFolded(!isFolded)}
        className="flex w-full items-center gap-2 py-1 text-left text-[13px]"
      >
        <IconInbox className="size-4 shrink-0 text-muted-foreground" />
        <span className="font-semibold">
          {count} request{count === 1 ? '' : 's'} from the shared link
        </span>
        <span className="text-muted-foreground max-sm:hidden">
          · Approve adds it; Decline keeps nothing
        </span>
        <IconChevronDown
          className={`ml-auto size-4 shrink-0 text-muted-foreground transition-transform ${
            isFolded ? '-rotate-90' : ''
          }`}
        />
      </button>
      {!isFolded && (
        <ul className="divide-y divide-border">
          {waiting.map((suggestion) => (
            <PageSuggestionRow key={suggestion.id} suggestion={suggestion} />
          ))}
        </ul>
      )}
    </section>
  )
}
