import { IconDownload, IconPencil } from '@tabler/icons-react'
import { ConfirmRemove } from '@/components/shared/confirm-remove'
import { ThemeSwatch } from '@/components/shared/theme-swatch'
import { downloadTheme, type ThemeCardProps } from './lib'

const ACTION = 'grid size-8 place-items-center rounded-lg text-muted-foreground hover:bg-accent'

/** Remove asks once in the row: pages wearing the theme go back to Washi. */
export function ThemeCard({ theme, madeBy, isChangeable, onEdit, onRemove }: ThemeCardProps) {
  return (
    <li className="flex items-center gap-3 border-border border-t px-4 py-2.5 first:border-t-0">
      <ThemeSwatch pair={theme} className="h-8 w-11 text-[12px]" />
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium text-[13.5px]">{theme.name}</p>
        <p className="truncate text-[12px] text-muted-foreground">
          <code className="font-mono">ws:{theme.slug}</code> · by {madeBy}
        </p>
      </div>
      <button
        type="button"
        onClick={() => downloadTheme(theme)}
        aria-label={`Export ${theme.name}`}
        title="Export"
        className={ACTION}
      >
        <IconDownload className="size-4" />
      </button>
      {isChangeable && (
        <>
          <button
            type="button"
            onClick={onEdit}
            aria-label={`Edit ${theme.name}`}
            title="Edit"
            className={ACTION}
          >
            <IconPencil className="size-4" />
          </button>
          <ConfirmRemove
            label={`Remove ${theme.name}`}
            title="Remove — pages wearing it go back to Washi"
            onConfirm={onRemove}
          />
        </>
      )}
    </li>
  )
}
