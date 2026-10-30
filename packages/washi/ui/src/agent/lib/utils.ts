import type { AgentSession, ApprovalMode, TranscriptEntry } from '@washi/domain'
import { hostPlace } from '../../api'
import type { InferenceView, ModelChoice, TurnDone } from './types'
import { COMPOSER_MIN_CAP_PX, COMPOSER_SHARE, RECOMMENDED_MODELS } from './values'

function duration(ms: number): string {
  const tenths = Math.round(ms / 100)
  if (tenths < 600) return `${(tenths / 10).toFixed(1)}s`
  const seconds = Math.round(ms / 1000)
  return `${Math.floor(seconds / 60)}m ${seconds % 60}s`
}

export function usd(amount: number): string {
  return amount > 0 && amount < 0.01 ? '<$0.01' : `$${amount.toFixed(2)}`
}

/** Where it ran, how long, who paid, on what — the receipt every turn ends with. */
export function receiptLine(update: TurnDone): string {
  const plan = update.billing === 'plan'
  const parts = [plan ? 'on your Claude plan' : `ran on ${hostPlace()}`]
  if (update.stopReason === 'cancelled') parts.unshift('stopped')
  if (update.durationMs != null) parts.push(duration(update.durationMs))
  if (update.costUsd != null)
    parts.push(plan ? `saved ${usd(update.costUsd)}` : usd(update.costUsd))
  if (update.model) parts.push(update.model)
  return parts.join(' · ')
}

/** Streamed text arrives a fragment per event; adjacent fragments are one message. */
export function mergeMessageChunks(entries: TranscriptEntry[]): TranscriptEntry[] {
  const merged: TranscriptEntry[] = []
  for (const entry of entries) {
    const last = merged.at(-1)
    if (entry.update.kind === 'message_chunk' && last?.update.kind === 'message_chunk') {
      merged[merged.length - 1] = {
        ...last,
        update: { ...last.update, text: last.update.text + entry.update.text },
      }
      continue
    }
    merged.push(entry)
  }
  return merged
}

/**
 * The workspace's picks for the provider its key is on, described where they are one of the
 * recommended. None for this provider — never chosen, all switched off, or chosen under another
 * key — offers the recommended three: the chip is never empty.
 */
export function offeredModels(inference: InferenceView | null): ModelChoice[] {
  const provider = inference?.provider ?? 'anthropic'
  const recommended = RECOMMENDED_MODELS[provider] ?? []
  const picked = inference?.enabledModels?.filter((model) => model.provider === provider) ?? []
  if (picked.length === 0) return recommended
  return picked.map((model) => ({
    id: model.id,
    label: model.name.replace(/^Claude /, ''),
    desc: recommended.find((pick) => pick.id === model.id)?.desc ?? '',
  }))
}

/** How tall the composer grows in `room` px before it scrolls; never under a few lines. */
export function composerCap(room: number): number {
  return Math.max(COMPOSER_MIN_CAP_PX, Math.round(room * COMPOSER_SHARE))
}

/** The YOLO chip shows only where the workspace allows it and Washi is awake (D115). */
export function isYoloOffered(inference: InferenceView | null): boolean {
  return inference !== null && inference.active !== null && inference.yoloAllowed
}

/** A conversation's own say, else the workspace's mode. */
export function approvalsOf(session: AgentSession | null, inference: InferenceView): ApprovalMode {
  return session?.approvals ?? inference.approvalMode
}

/** The opposite of what holds now; the workspace's own mode is sent as null, so it follows it. */
export function nextApprovals(
  session: AgentSession | null,
  inference: InferenceView,
): ApprovalMode | null {
  const next = approvalsOf(session, inference) === 'auto' ? 'ask' : 'auto'
  return next === inference.approvalMode ? null : next
}
