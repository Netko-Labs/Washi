import { IconMessageCircle, IconMoodSmile, IconPhoto } from '@tabler/icons-react'
import { SheetIcon, useSheetsStore } from '@washi/ui'
import { useState } from 'react'
import { useCommentsStore } from '@/components/comments'
import { CoverPicker } from './cover-picker'
import { IconPicker } from './icon-picker'
import { type ChromePicker, COVERS, type PageChromeProps } from './lib'
import { WashiMark } from './washi-mark'

const QUIET_BUTTON =
  'flex h-7 items-center gap-1.5 rounded-md px-2 text-[12.5px] text-muted-foreground hover:bg-accent'

/** Notion's band above a page: a cover, a big icon, and quiet buttons that add either. */
export function PageChrome({ pageId }: PageChromeProps) {
  const sheet = useSheetsStore((state) => state.sheets.find((entry) => entry.id === pageId))
  const [picker, setPicker] = useState<ChromePicker | null>(null)
  if (!sheet) return null

  const cover = sheet.cover ? COVERS[sheet.cover] : undefined
  const update = useSheetsStore.getState().updateMeta
  const close = () => setPicker(null)

  return (
    <div className="group/chrome relative">
      {cover && (
        <div className="relative h-[180px] w-full" style={{ background: cover.background }}>
          <button
            type="button"
            onClick={() => setPicker('cover')}
            className="absolute right-4 bottom-3 hidden rounded-md bg-background/85 px-2 py-1 text-[12px] backdrop-blur group-hover/chrome:block"
          >
            Change cover
          </button>
        </div>
      )}
      <div className={`relative mx-auto px-8 ${sheet.fullWidth ? '' : 'max-w-[760px]'}`}>
        <WashiMark sheet={sheet} />
        {sheet.icon && (
          <button
            type="button"
            aria-label="Change the icon"
            onClick={() => setPicker('icon')}
            className={`grid size-[72px] place-items-center rounded-xl hover:bg-accent ${
              cover ? '-mt-9' : 'mt-8'
            }`}
          >
            <SheetIcon name={sheet.icon} className="size-11 text-[52px]" />
          </button>
        )}
        {(!sheet.icon || !cover) && (
          <div
            className={`flex h-9 items-center gap-1 opacity-0 focus-within:opacity-100 group-hover/chrome:opacity-100 ${
              sheet.icon || cover ? '' : 'pt-4'
            }`}
          >
            {!sheet.icon && (
              <button type="button" onClick={() => setPicker('icon')} className={QUIET_BUTTON}>
                <IconMoodSmile className="size-4" />
                Add icon
              </button>
            )}
            {!cover && (
              <button type="button" onClick={() => setPicker('cover')} className={QUIET_BUTTON}>
                <IconPhoto className="size-4" />
                Add cover
              </button>
            )}
            <button
              type="button"
              onClick={() => useCommentsStore.getState().open(sheet.id)}
              className={QUIET_BUTTON}
            >
              <IconMessageCircle className="size-4" />
              Add comment
            </button>
          </div>
        )}
        {picker === 'icon' && (
          <IconPicker
            current={sheet.icon}
            onClose={close}
            onPick={(icon) => {
              close()
              void update(sheet.id, { icon })
            }}
          />
        )}
        {picker === 'cover' && (
          <CoverPicker
            current={sheet.cover}
            onClose={close}
            onPick={(next) => {
              close()
              void update(sheet.id, { cover: next })
            }}
          />
        )}
      </div>
    </div>
  )
}
