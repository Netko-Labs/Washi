import { IconSearch } from '@tabler/icons-react'
import { emojiName, useCustomEmojis, useRecentEmoji } from '@/components/shared/emoji'
import { CategoryBar } from './category-bar'
import { CustomGlyph } from './custom-glyph'
import { EmojiTile } from './emoji-tile'
import { type EmojiPanelProps, useEmojiPanel } from './lib'
import { PanelSection } from './panel-section'
import { WorkspaceEmojis } from './workspace-emojis'

/** The workspace's own first, then this person's recent picks, then Unicode a group at a time. */
export function EmojiPanel({ current, onPick }: EmojiPanelProps) {
  const book = useCustomEmojis()
  const { recent, remember } = useRecentEmoji()
  const panel = useEmojiPanel(book.emojis)

  const pick = (value: string) => {
    remember(value)
    onPick(value)
  }
  const customByKey = new Map(book.emojis.map((emoji) => [`file:${emoji.fileId}`, emoji]))
  const recentShown = recent.filter((value) => !value.startsWith('file:') || customByKey.has(value))

  return (
    <div>
      <label className="mb-1.5 flex h-8 items-center gap-2 rounded-lg border border-border bg-background px-2 focus-within:border-primary">
        <IconSearch className="size-3.5 shrink-0 text-muted-foreground" />
        <input
          // biome-ignore lint/a11y/noAutofocus: the picker opens to be typed into
          autoFocus
          value={panel.query}
          onChange={(event) => panel.setQuery(event.target.value)}
          placeholder="Search emoji"
          aria-label="Search emoji"
          className="min-w-0 flex-1 bg-transparent text-[13px] outline-none"
        />
      </label>
      <CategoryBar
        active={panel.categoryId}
        isDimmed={panel.isSearching}
        onChange={(id) => {
          panel.setQuery('')
          panel.setCategoryId(id)
        }}
      />

      <div key={panel.category.id} className="h-[272px] overflow-y-auto overscroll-contain pr-0.5">
        <WorkspaceEmojis emojis={panel.customs} add={book.add} current={current} onPick={pick} />
        {!panel.isSearching && recentShown.length > 0 && (
          <PanelSection title="Recent">
            {recentShown.map((value) => {
              const custom = customByKey.get(value)
              return (
                <EmojiTile
                  key={value}
                  value={value}
                  label={custom ? `:${custom.name}:` : (emojiName(value) ?? value)}
                  isCurrent={current === value}
                  onPick={pick}
                >
                  {custom ? <CustomGlyph fileId={custom.fileId} name={custom.name} /> : value}
                </EmojiTile>
              )
            })}
          </PanelSection>
        )}
        <PanelSection title={panel.category.label}>
          {panel.category.entries.map((entry) => (
            <EmojiTile
              key={entry.emoji}
              value={entry.emoji}
              label={entry.name}
              isCurrent={current === entry.emoji}
              onPick={pick}
            >
              {entry.emoji}
            </EmojiTile>
          ))}
        </PanelSection>
        {panel.isSearching && panel.category.entries.length === 0 && panel.customs.length === 0 && (
          <p className="px-1 py-6 text-center text-[12.5px] text-muted-foreground">
            No emoji called that.
          </p>
        )}
      </div>
    </div>
  )
}
