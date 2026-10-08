import type { TurnDoneView } from './types'

export function formatDuration(ms: number): string {
  if (ms < 60_000) return `${(ms / 1000).toFixed(1)}s`
  const minutes = Math.floor(ms / 60_000)
  return `${minutes}m ${Math.round((ms % 60_000) / 1000)}s`
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
