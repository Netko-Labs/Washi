import { useMemo, useState } from 'react'
import { Floating } from '@/components/shared/floating'
import { ICON_TABS, type IconTab, type PickerProps, usePickerRoot } from '../lib'
import { PickerTabs } from '../picker-tabs'
import { UploadDrop } from '../upload-drop'
import { EmojiPanel } from './emoji-panel'

/** Emoji · Upload. An upload is stored like a cover's and the page wears `file:<id>` (D60). */
export function IconPicker({ anchor, current, onPick, onClose }: PickerProps) {
  const root = usePickerRoot(onClose)
  const anchorRef = useMemo(() => ({ current: anchor }), [anchor])
  const [tab, setTab] = useState<IconTab>('emoji')

  return (
    <Floating anchor={anchorRef} offset={4} role="dialog" aria-label="Choose an icon">
      <div
        ref={root}
        className="w-[344px] max-w-[calc(100vw-16px)] rounded-xl border border-border bg-popover p-2 text-popover-foreground shadow-[0_16px_48px_rgb(0_0_0/0.18)]"
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

        {tab === 'emoji' && <EmojiPanel current={current} onPick={onPick} />}
        {tab === 'upload' && (
          <UploadDrop hint="Square works best · JPG · PNG · WebP · up to 5 MB" onPick={onPick} />
        )}
      </div>
    </Floating>
  )
}
