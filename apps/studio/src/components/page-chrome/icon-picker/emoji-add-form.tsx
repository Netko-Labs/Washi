import { IconPhoto } from '@tabler/icons-react'
import { useEmojiDraft } from '@/components/shared/emoji'
import type { EmojiAddFormProps } from './lib'

/** A picture and a `:name:`; it joins the workspace's emojis for everyone in it. */
export function EmojiAddForm({ add, onDone }: EmojiAddFormProps) {
  const draft = useEmojiDraft(add, onDone)

  return (
    <form
      className="mx-1 mt-1 grid gap-1.5 rounded-lg border border-border bg-background p-2"
      onSubmit={(event) => {
        event.preventDefault()
        void draft.submit()
      }}
    >
      <div className="flex items-center gap-1.5">
        <label className="flex h-8 shrink-0 cursor-pointer items-center gap-1.5 rounded-lg border border-border bg-card px-2 text-[12px] hover:border-primary">
          <IconPhoto className="size-3.5 text-muted-foreground" />
          <span className="max-w-[88px] truncate">{draft.file ? draft.file.name : 'Picture…'}</span>
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
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
          className="h-8 min-w-0 flex-1 rounded-lg border border-border bg-card px-2 font-mono text-[12px] outline-none focus-visible:border-primary"
        />
        <button
          type="submit"
          disabled={!draft.isReady || draft.busy}
          className="h-8 shrink-0 rounded-lg bg-primary px-2.5 font-semibold text-[12px] text-primary-foreground disabled:opacity-50"
        >
          {draft.busy ? 'Adding…' : 'Add'}
        </button>
      </div>
      {draft.error ? (
        <span className="text-[12px] text-destructive">{draft.error}</span>
      ) : (
        draft.note && <span className="text-[12px] text-muted-foreground">{draft.note}</span>
      )}
    </form>
  )
}
