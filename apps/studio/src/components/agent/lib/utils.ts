import type { TranscriptEntryView, TurnDoneView } from './types'

export function formatDuration(ms: number): string {
  const tenths = Math.round(ms / 100)
  if (tenths < 600) return `${(tenths / 10).toFixed(1)}s`
  const seconds = Math.round(ms / 1000)
  return `${Math.floor(seconds / 60)}m ${seconds % 60}s`
}

export function formatUsd(amount: number): string {
  return amount > 0 && amount < 0.01 ? '<$0.01' : `$${amount.toFixed(2)}`
}

/** The receipt line: where it ran, how long, who paid, on what. Facts only. */
export function receiptParts(update: TurnDoneView): string[] {
  const plan = update.billing === 'plan'
  const parts = [plan ? 'on your Claude plan' : 'ran on your server']
  if (update.stopReason === 'cancelled') parts.unshift('stopped')
  if (update.durationMs != null) parts.push(formatDuration(update.durationMs))
  if (update.costUsd != null) {
    parts.push(plan ? `saved ${formatUsd(update.costUsd)}` : formatUsd(update.costUsd))
  }
  if (update.model) parts.push(update.model)
  return parts
}

/** Streamed chunks arrive one per event; adjacent ones are a single message. */
export function mergeMessageChunks(entries: TranscriptEntryView[]): TranscriptEntryView[] {
  const merged: TranscriptEntryView[] = []
  for (const entry of entries) {
    const last = merged.at(-1)
    if (entry.update.kind === 'message_chunk' && last?.update.kind === 'message_chunk') {
      merged[merged.length - 1] = {
        ...last,
        update: { kind: 'message_chunk', text: last.update.text + entry.update.text },
      }
      continue
    }
    merged.push(entry)
  }
  return merged
}
