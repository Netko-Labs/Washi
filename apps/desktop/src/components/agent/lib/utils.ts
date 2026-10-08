import type { AgentUpdate } from '@washi/domain'

type TurnDone = Extract<AgentUpdate, { kind: 'turn_done' }>

function duration(ms: number): string {
  if (ms < 60_000) return `${(ms / 1000).toFixed(1)}s`
  return `${Math.floor(ms / 60_000)}m ${Math.round((ms % 60_000) / 1000)}s`
}

export function usd(amount: number): string {
  return amount > 0 && amount < 0.01 ? '<$0.01' : `$${amount.toFixed(2)}`
}

/** Where it ran, how long, who paid, on what — the receipt every turn ends with. */
export function receiptLine(update: TurnDone): string {
  const plan = update.billing === 'plan'
  const parts = [plan ? 'on your Claude plan' : 'ran on this computer']
  if (update.stopReason === 'cancelled') parts.unshift('stopped')
  if (update.durationMs != null) parts.push(duration(update.durationMs))
  if (update.costUsd != null)
    parts.push(plan ? `saved ${usd(update.costUsd)}` : usd(update.costUsd))
  if (update.model) parts.push(update.model)
  return parts.join(' · ')
}
