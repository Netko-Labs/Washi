import { IconTrash } from '@tabler/icons-react'
import { hostFileUrl } from '@washi/ui'
import type { EmojiCardProps } from './lib'

export function EmojiCard({ emoji, addedBy, isRemovable, onRemove }: EmojiCardProps) {
  const url = hostFileUrl()?.(emoji.fileId)

  return (
    <li className="group flex items-center gap-2.5 rounded-xl border border-border bg-background px-2.5 py-2">
      <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-muted">
        {url && <img src={url} alt="" loading="lazy" className="size-7 object-contain" />}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate font-mono text-[12.5px]">:{emoji.name}:</span>
        <span className="block truncate text-[11.5px] text-muted-foreground">by {addedBy}</span>
      </span>
      {isRemovable && (
        <button
          type="button"
          onClick={() => onRemove(emoji.id)}
          aria-label={`Remove :${emoji.name}:`}
          className="grid size-7 shrink-0 place-items-center rounded-lg text-muted-foreground opacity-0 hover:bg-accent hover:text-destructive focus-visible:opacity-100 group-hover:opacity-100 max-md:opacity-100"
        >
          <IconTrash className="size-4" />
        </button>
      )}
    </li>
  )
}
