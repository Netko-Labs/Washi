import { useState } from 'react'
import {
  COVER_TABS,
  COVERS,
  type CoverTab,
  PICTURES,
  type PickerProps,
  pictureUrl,
  sameCover,
  usePickerRoot,
} from './lib'
import { PickerTabs } from './picker-tabs'
import { UploadDrop } from './upload-drop'

const TILE =
  'relative flex h-14 items-end overflow-hidden rounded-lg p-1.5 text-left ring-offset-2 ring-offset-popover'
const LABEL = 'rounded bg-black/35 px-1 font-medium text-[10.5px] text-white'

/** Presets · Pictures · Upload. Whatever is picked, the page stores a key (D60). */
export function CoverPicker({ current, onPick, onClose }: PickerProps) {
  const root = usePickerRoot(onClose)
  const [tab, setTab] = useState<CoverTab>(() =>
    current?.startsWith('picture:') ? 'pictures' : 'presets',
  )

  const ring = (on: boolean) => (on ? 'ring-2 ring-primary' : 'hover:ring-2 hover:ring-border')

  return (
    <div
      ref={root}
      role="dialog"
      aria-label="Choose a cover"
      className="absolute top-full right-0 z-40 mt-1 w-[300px] rounded-xl border border-border bg-popover p-2 text-popover-foreground shadow-[0_16px_48px_rgb(0_0_0/0.18)]"
    >
      <div className="flex items-center justify-between px-1 pb-1.5">
        <span className="font-semibold text-[11px] text-muted-foreground uppercase tracking-[0.06em]">
          Cover
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
      <PickerTabs tabs={COVER_TABS} active={tab} onChange={setTab} />

      {tab === 'presets' && (
        <div className="grid grid-cols-3 gap-1.5">
          {Object.entries(COVERS).map(([key, cover]) => (
            <button
              key={key}
              type="button"
              onClick={() => onPick(`preset:${key}`)}
              className={`${TILE} ${ring(sameCover(current, 'preset', key))}`}
              style={{ background: cover.background }}
            >
              <span className={LABEL}>{cover.label}</span>
            </button>
          ))}
        </div>
      )}

      {tab === 'pictures' && (
        <div className="grid max-h-[260px] grid-cols-3 gap-1.5 overflow-y-auto">
          {PICTURES.map((picture) => (
            <button
              key={picture.slug}
              type="button"
              onClick={() => onPick(`picture:${picture.slug}`)}
              className={`${TILE} h-16 bg-muted ${ring(sameCover(current, 'picture', picture.slug))}`}
              style={{
                backgroundImage: `url(${pictureUrl(picture.slug)})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
              }}
            >
              <span className={LABEL}>{picture.label}</span>
            </button>
          ))}
        </div>
      )}

      {tab === 'upload' && <UploadDrop hint="JPG · PNG · WebP · up to 5 MB" onPick={onPick} />}
    </div>
  )
}
