import type { AgentSession } from '@washi/domain'
import { editedAt } from '@washi/ui'
import { DAY_MS } from './constants'
import type { ChatGroup, SnippetPart } from './types'

function startOfDay(ms: number): number {
  const day = new Date(ms)
  day.setHours(0, 0, 0, 0)
  return day.getTime()
}

export function dayLabel(ms: number, now = Date.now()): string {
  const days = Math.round((startOfDay(now) - startOfDay(ms)) / DAY_MS)
  if (days <= 0) return 'Today'
  if (days === 1) return 'Yesterday'
  const sameYear = new Date(ms).getFullYear() === new Date(now).getFullYear()
  return new Date(ms).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    ...(!sameYear && { year: 'numeric' }),
  })
}

/** Newest first, already sorted by the server; one group per calendar day. */
export function groupByDay(chats: AgentSession[], now = Date.now()): ChatGroup[] {
  const groups: ChatGroup[] = []
  for (const chat of chats) {
    const label = dayLabel(editedAt(chat.updatedAt), now)
    const last = groups.at(-1)
    if (last?.label === label) last.chats.push(chat)
    else groups.push({ label, chats: [chat] })
  }
  return groups
}

/** The server marks a match with ⟦ ⟧ (`searchChats`). */
export function snippetParts(snippet: string): SnippetPart[] {
  return snippet
    .split(/(⟦[^⟧]*⟧)/)
    .filter(Boolean)
    .map((part) =>
      part.startsWith('⟦')
        ? { text: part.slice(1, -1), isHit: true }
        : { text: part, isHit: false },
    )
}

export function chatPath(workspaceId: string, chatId?: string | null): string {
  return `/w/${workspaceId}/chats/${chatId ?? 'new'}`
}
