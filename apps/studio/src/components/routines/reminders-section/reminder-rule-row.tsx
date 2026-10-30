import { IconBell } from '@tabler/icons-react'
import { ConfirmRemove } from '@/components/shared/confirm-remove'
import { ToggleSwitch } from '../toggle-switch'
import { type ReminderRuleRowProps, ruleSummary } from './lib'

/** A rule in one line: its name, when it speaks, its switch, and a way to drop it. */
export function ReminderRuleRow({ reminder, onToggle, onRemove }: ReminderRuleRowProps) {
  return (
    <li className="flex items-center gap-3.5 rounded-xl border border-border bg-card px-4 py-3">
      <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-accent text-muted-foreground">
        <IconBell className="size-[18px]" />
      </span>
      <span className="min-w-0 flex-1">
        <span
          className={`block truncate font-medium text-[14px] ${reminder.enabled ? '' : 'text-muted-foreground'}`}
        >
          {reminder.title}
        </span>
        <span className="block truncate text-[12.5px] text-muted-foreground">
          {ruleSummary(reminder)}
        </span>
      </span>
      <ConfirmRemove label={`Delete ${reminder.title}`} onConfirm={onRemove} />
      <ToggleSwitch
        isOn={reminder.enabled}
        label={`${reminder.enabled ? 'Pause' : 'Resume'} ${reminder.title}`}
        onChange={onToggle}
      />
    </li>
  )
}
