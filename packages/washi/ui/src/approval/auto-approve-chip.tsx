import { IconBolt } from '@tabler/icons-react'
import { useAutoApprove } from './lib'

/** The switch where approvals happen: on, Washi makes changes without stopping to ask. */
export function AutoApproveChip() {
  const { on, toggle } = useAutoApprove()
  if (on === null) return null

  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      onClick={() => void toggle()}
      title={
        on
          ? 'Washi creates and edits pages and tables without asking. Click to ask first again.'
          : 'Let Washi create and edit pages and tables without asking. Websites and actions still ask.'
      }
      className={`flex h-[26px] shrink-0 items-center gap-1 rounded-full border px-2 font-medium text-[11px] transition-colors ${
        on
          ? 'border-primary bg-primary/10 text-primary'
          : 'border-border text-muted-foreground hover:bg-accent hover:text-foreground'
      }`}
      data-auto-approve
    >
      <IconBolt className="size-3" />
      {on ? 'Auto-approve on' : 'Auto-approve'}
    </button>
  )
}
