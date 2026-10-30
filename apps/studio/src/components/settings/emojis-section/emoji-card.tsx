import { hostFileUrl } from '@washi/ui'
import { ConfirmRemove } from '@/components/shared/confirm-remove'
import type { EmojiCardProps } from './lib'

/** One emoji a row, as Slack lists them: the picture, its whole `:name:`, who added it. */
export function EmojiCard({ emoji, addedBy, isRemovable, onRemove }: EmojiCardProps) {
  const url = hostFileUrl()?.(emoji.fileId)

  return (
    <li className="flex items-center gap-3 border-border border-t px-4 py-2.5 first:border-t-0">
      <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-muted">
        {url && <img src={url} alt="" loading="lazy" className="size-7 object-contain" />}
      </span>
      <code className="min-w-0 flex-1 break-all font-mono text-[13px]">:{emoji.name}:</code>
      <span className="max-w-[40%] shrink-0 truncate text-[12.5px] text-muted-foreground">
        by {addedBy}
      </span>
      {isRemovable && (
        <ConfirmRemove label={`Remove :${emoji.name}:`} onConfirm={() => onRemove(emoji.id)} />
      )}
    </li>
  )
}
