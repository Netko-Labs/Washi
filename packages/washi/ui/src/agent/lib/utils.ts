import type { AgentUpdate, TranscriptEntry } from '@washi/domain'
import { hostPlace } from '../../api'
import type { InferenceView, ModelChoice } from './types'
import { RECOMMENDED_MODELS } from './values'

type TurnDone = Extract<AgentUpdate, { kind: 'turn_done' }>

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
