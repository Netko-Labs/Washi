import { IconPlus } from '@tabler/icons-react'
import { useState } from 'react'
import { CustomGlyph } from './custom-glyph'
import { EmojiAddForm } from './emoji-add-form'
import { EmojiTile } from './emoji-tile'
import type { WorkspaceEmojisProps } from './lib'
import { PanelSection } from './panel-section'

/** The team's own pictures as emoji; picking one makes the page wear its `file:<id>`. */
export function WorkspaceEmojis({ emojis, add, current, onPick }: WorkspaceEmojisProps) {
  const [isAdding, setAdding] = useState(false)

  return (
    <>
      <PanelSection title="This workspace">
        {emojis.map((emoji) => (
          <EmojiTile
            key={emoji.id}
            value={`file:${emoji.fileId}`}
            label={`:${emoji.name}:`}
            isCurrent={current === `file:${emoji.fileId}`}
            onPick={onPick}
          >
            <CustomGlyph fileId={emoji.fileId} name={emoji.name} />
          </EmojiTile>
        ))}
        <button
          type="button"
          title="Add emoji"
          aria-label="Add emoji"
          aria-pressed={isAdding}
          onClick={() => setAdding(!isAdding)}
          className="grid h-9 place-items-center rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground aria-pressed:bg-accent"
        >
          <IconPlus className="size-4" />
        </button>
      </PanelSection>
      {isAdding && <EmojiAddForm add={add} onDone={() => setAdding(false)} />}
    </>
  )
}
