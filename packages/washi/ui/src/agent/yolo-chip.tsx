import { IconBolt } from '@tabler/icons-react'
import { useAgentStore } from '../stores'
import { approvalsOf, isYoloOffered, nextApprovals, type YoloProps } from './lib'

/** A conversation that approves everything for itself, where the workspace allows it (D115). */
export function YoloChip({ session, inference }: YoloProps) {
  if (!inference || !isYoloOffered(inference)) return null
  const isOn = approvalsOf(session, inference) === 'auto'

  return (
    <button
      type="button"
      role="switch"
      aria-checked={isOn}
      onClick={() =>
        void useAgentStore
          .getState()
          .setSessionOptions({ approvals: nextApprovals(session, inference) })
      }
      title="Approve everything Washi reaches out for in this conversation"
      className={`flex h-6 shrink-0 items-center gap-1 rounded-full border px-2 font-medium text-[11px] ${
        isOn
          ? 'border-primary bg-primary text-primary-foreground'
          : 'border-border bg-card text-muted-foreground hover:bg-accent'
      }`}
    >
      <IconBolt className="size-3" />
      YOLO
    </button>
  )
}

export function YoloNote({ session, inference }: YoloProps) {
  if (!inference || !isYoloOffered(inference) || approvalsOf(session, inference) !== 'auto') {
    return null
  }
  return (
    <p className="px-2 pt-1.5 text-[11.5px] text-muted-foreground">
      Washi won’t ask before reaching out in this conversation
    </p>
  )
}
