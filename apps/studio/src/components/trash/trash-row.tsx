import { IconRestore } from '@tabler/icons-react'
import { relativeTime, SheetIcon } from '@washi/ui'
import { ConfirmTextButton } from './confirm-text-button'
import type { TrashRowProps } from './lib'

export function TrashRow({ entry, onRestore, onPurge }: TrashRowProps) {
  return (
    <li className="flex items-center gap-3 rounded-xl px-3 py-2.5 hover:bg-accent">
      <SheetIcon name={entry.icon} className="size-4 shrink-0 text-muted-foreground" />
      <span className="min-w-0 flex-1">
        <span className="block truncate font-medium text-[13.5px]">{entry.title}</span>
        <span className="block text-[12px] text-muted-foreground">
          Deleted {relativeTime(entry.deletedAt)}
          {entry.nestedCount > 0 &&
            ` · with ${entry.nestedCount} page${entry.nestedCount === 1 ? '' : 's'} inside`}
        </span>
      </span>
      <button
        type="button"
        onClick={onRestore}
        className="flex h-7 shrink-0 items-center gap-1.5 rounded-lg border border-border px-2.5 font-medium text-[12px] hover:border-primary hover:text-primary"
      >
        <IconRestore className="size-3.5" />
        Restore
      </button>
      <ConfirmTextButton idle="Delete forever" armed="Sure? Delete" onConfirm={onPurge} />
    </li>
  )
}
