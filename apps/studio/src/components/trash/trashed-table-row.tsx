import { IconDatabase, IconRestore } from '@tabler/icons-react'
import { relativeTime } from '@washi/ui'
import { ConfirmTextButton } from './confirm-text-button'
import type { TrashedTableRowProps } from './lib'

export function TrashedTableRow({ table, onRestore, onPurge }: TrashedTableRowProps) {
  return (
    <li className="flex items-center gap-3 rounded-xl px-3 py-2.5 hover:bg-accent">
      <IconDatabase className="size-4 shrink-0 text-muted-foreground" />
      <span className="min-w-0 flex-1">
        <span className="block truncate font-medium text-[13.5px]">{table.name}</span>
        <span className="block text-[12px] text-muted-foreground">
          Deleted {relativeTime(table.deletedAt)} · {table.rows} row{table.rows === 1 ? '' : 's'}{' '}
          kept
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
