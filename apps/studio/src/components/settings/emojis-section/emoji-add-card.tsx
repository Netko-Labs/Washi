import { IconUpload } from '@tabler/icons-react'
import { acceptFor } from '@washi/domain'
import { useEmojiDraft } from '@/components/shared/emoji'
import { SettingsCard } from '../shared/card'
import type { EmojiAddCardProps } from './lib'

/** A square picture reads best at 20px; the name is how a search finds it. */
export function EmojiAddCard({ add }: EmojiAddCardProps) {
  const draft = useEmojiDraft(add)

  return (
    <SettingsCard
      title="Add an emoji"
      desc="JPG · PNG · WebP · GIF, up to 10 MB. Square works best."
    >
      <form
        className="flex flex-wrap items-center gap-2 px-4 py-3"
        onSubmit={(event) => {
          event.preventDefault()
          void draft.submit()
        }}
      >
        <label className="flex h-9 cursor-pointer items-center gap-2 rounded-xl border border-border bg-background px-3 text-[13px] hover:border-primary">
          <IconUpload className="size-4 text-muted-foreground" />
          <span className="max-w-[160px] truncate">
            {draft.file ? draft.file.name : 'Pick a picture'}
          </span>
          <input
            type="file"
            accept={acceptFor('image')}
            className="sr-only"
            disabled={draft.busy}
            onChange={(event) => draft.setFile(event.target.files?.[0] ?? null)}
          />
        </label>
        <input
          value={draft.name}
          onChange={(event) => draft.setName(event.target.value)}
          placeholder=":name:"
          aria-label="Emoji name"
          className="h-9 min-w-[140px] flex-1 rounded-xl border border-border bg-background px-3 font-mono text-[13px] outline-none focus-visible:border-primary"
        />
        <button
          type="submit"
          disabled={!draft.isReady || draft.busy}
          className="h-9 shrink-0 rounded-xl border border-border px-4 font-semibold text-[13px] hover:bg-accent disabled:opacity-50"
        >
          {draft.busy ? 'Adding…' : 'Add'}
        </button>
        {draft.error ? (
          <p className="w-full text-[12.5px] text-destructive">{draft.error}</p>
        ) : (
          draft.note && <p className="w-full text-[12.5px] text-muted-foreground">{draft.note}</p>
        )}
      </form>
    </SettingsCard>
  )
}
