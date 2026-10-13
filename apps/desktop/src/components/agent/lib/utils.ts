import type { AgentUpdate } from '@washi/domain'

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
  const parts = [plan ? 'on your Claude plan' : 'ran on this computer']
  if (update.stopReason === 'cancelled') parts.unshift('stopped')
  if (update.durationMs != null) parts.push(duration(update.durationMs))
  if (update.costUsd != null)
    parts.push(plan ? `saved ${usd(update.costUsd)}` : usd(update.costUsd))
  if (update.model) parts.push(update.model)
  return parts.join(' · ')
}
