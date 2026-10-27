import { getTranscript, listSessions, type Workspace } from '@washi/repository'
import { PROMPT_PREVIEW_CHARS, TODAY_TURN_LIMIT, TODAY_WINDOW_MS, type TurnSummary } from './lib'

/** HLC strings lead with zero-padded wall-clock ms. */
export function hlcMs(hlc: string): number {
  const wall = Number(hlc.split('-')[0])
  return Number.isFinite(wall) ? wall : 0
}

/**
 * Every finished turn in the window, newest first, as a person would retell it:
 * what was asked, what it touched, and its receipt. Read from the transcript —
 * the transcript already is the log, so nothing new is stored.
 */
export function recentTurns(
  ws: Workspace,
  viewerId?: string | null,
  now = Date.now(),
  windowMs = TODAY_WINDOW_MS,
  limit = TODAY_TURN_LIMIT,
): TurnSummary[] {
  const since = now - windowMs
  // Keyed by HLC: it orders correctly where two turns share a millisecond.
  const turns: { hlc: string; summary: TurnSummary }[] = []

  for (const session of listSessions(ws, viewerId)) {
    if (hlcMs(session.updatedAt) < since) continue
    let prompt = ''
    let tools: string[] = []
    for (const entry of getTranscript(ws, session.id)) {
      const { update } = entry
      if (update.kind === 'user_message') {
        prompt = update.text.slice(0, PROMPT_PREVIEW_CHARS)
        tools = []
      } else if (update.kind === 'tool_call' && !tools.includes(update.title)) {
        tools.push(update.title)
      } else if (update.kind === 'turn_done' && hlcMs(entry.createdAt) >= since) {
        turns.push({
          hlc: entry.createdAt,
          summary: {
            sessionId: session.id,
            sessionTitle: session.title,
            prompt,
            tools,
            receipt: update,
            at: hlcMs(entry.createdAt),
          },
        })
      }
    }
  }

  return turns
    .sort((a, b) => (a.hlc < b.hlc ? 1 : a.hlc > b.hlc ? -1 : 0))
    .slice(0, limit)
    .map((turn) => turn.summary)
}
