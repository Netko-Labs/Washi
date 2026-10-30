import type { TranscriptEntry } from '@washi/domain'
import type { PromptRequest } from './ports'

/**
 * The conversation as the AI SDK port needs it: each user message, then the
 * assistant text that answered it. The last user message is the turn being run.
 */
export function conversationHistory(entries: TranscriptEntry[]): PromptRequest['history'] {
  const history: PromptRequest['history'] = []
  for (const { update } of entries) {
    if (update.kind === 'user_message') {
      history.push({ role: 'user', text: update.text })
      continue
    }
    if (update.kind !== 'message_chunk') continue
    const last = history.at(-1)
    if (last?.role === 'assistant') last.text += update.text
    else history.push({ role: 'assistant', text: update.text })
  }
  if (history.at(-1)?.role === 'user') history.pop()
  return history
}

/** The turn before the latest ask ended because a person pressed Stop. */
export function followsStop(entries: TranscriptEntry[]): boolean {
  let asks = 0
  for (let index = entries.length - 1; index >= 0; index--) {
    const update = entries[index]?.update
    if (update?.kind === 'user_message' && ++asks > 1) return false
    if (asks === 1 && update?.kind === 'turn_done') return update.stopReason === 'cancelled'
  }
  return false
}
