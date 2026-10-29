import { useCustomEmojis } from '@/components/shared/emoji'
import { SettingsCard } from '../shared/card'
import { useMayChange, useMemberNames } from '../shared/stewardship'
import { EmojiAddCard } from './emoji-add-card'
import { EmojiCard } from './emoji-card'

/** What the icon picker's "This workspace" row holds; everyone in the workspace sees them. */
export function EmojisSection() {
  const { emojis, error, add, remove } = useCustomEmojis()
  const names = useMemberNames()
  const mayRemove = useMayChange()

  return (
    <div className="grid gap-4">
      <EmojiAddCard add={add} />
      <SettingsCard
        title="This workspace’s emojis"
        desc={
          emojis.length === 0
            ? 'None yet. Add a picture above and it shows first in every icon picker.'
            : `${emojis.length} in the picker, before the Unicode set.`
        }
      >
        {emojis.length > 0 && (
          <ul className="grid grid-cols-[repeat(auto-fill,minmax(140px,1fr))] gap-1.5 border-border border-t p-3">
            {emojis.map((emoji) => (
              <EmojiCard
                key={emoji.id}
                emoji={emoji}
                addedBy={names.get(emoji.createdBy) ?? 'someone'}
                isRemovable={mayRemove(emoji.createdBy)}
                onRemove={(id) => void remove(id)}
              />
            ))}
          </ul>
        )}
        {error && (
          <p className="border-border border-t px-4 py-3 text-[13px] text-destructive">{error}</p>
        )}
      </SettingsCard>
    </div>
  )
}
