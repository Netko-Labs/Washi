import { useState } from 'react'
import { EMOJI, ICON_TABS, type IconTab, type PickerProps, useAnchored, usePickerRoot } from './lib'
import { PickerTabs } from './picker-tabs'
import { UploadDrop } from './upload-drop'

/** Emoji · Upload. An upload is stored like a cover's and the page wears `file:<id>` (D60). */
export function IconPicker({ anchor, current, onPick, onClose }: PickerProps) {
  const root = usePickerRoot(onClose)
  const at = useAnchored(anchor)
  const [tab, setTab] = useState<IconTab>(() => (current?.startsWith('file:') ? 'upload' : 'emoji'))

  return (
    <div
      ref={root}
      role="dialog"
      aria-label="Choose an icon"
      style={at}
      className="fixed z-50 w-[300px] rounded-xl border border-border bg-popover p-2 text-popover-foreground shadow-[0_16px_48px_rgb(0_0_0/0.18)]"
    >
      <div className="flex items-center justify-between px-1 pb-1.5">
        <span className="font-semibold text-[11px] text-muted-foreground uppercase tracking-[0.06em]">
          Icon
        </span>
        {current && (
          <button
            type="button"
            onClick={() => onPick(null)}
            className="rounded px-1.5 py-0.5 text-[12px] text-muted-foreground hover:bg-accent"
          >
            Remove
          </button>
        )}
      </div>
      <PickerTabs tabs={ICON_TABS} active={tab} onChange={setTab} />

      {tab === 'emoji' && (
        <div className="grid grid-cols-8 gap-0.5">
          {EMOJI.map((emoji) => (
            <button
              key={emoji}
              type="button"
              aria-label={`Use ${emoji}`}
              onClick={() => onPick(emoji)}
              className={`grid size-8 place-items-center rounded-lg text-[18px] hover:bg-accent ${
                current === emoji ? 'bg-accent' : ''
              }`}
            >
              {emoji}
            </button>
          ))}
        </div>
      )}

      {tab === 'upload' && (
        <UploadDrop hint="Square works best · JPG · PNG · WebP · up to 5 MB" onPick={onPick} />
      )}
    </div>
  )
}
