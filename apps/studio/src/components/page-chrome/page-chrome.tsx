import { IconMessageCircle, IconMoodSmile, IconPhoto } from '@tabler/icons-react'
import type { SheetMetaPatch } from '@washi/domain'
import { useSheetsStore } from '@washi/ui'
import { useEffect } from 'react'
import { useCommentsStore } from '@/components/comments'
import { PagePresence } from '@/components/presence'
import { RowProperties } from '@/components/row-properties'
import { CoverPicker } from './cover-picker'
import { IconPicker } from './icon-picker'
import { type PageChromeProps, useLookPickerStore } from './lib'
import { WashiMark } from './washi-mark'

const QUIET_BUTTON =
  'flex h-7 items-center gap-1.5 rounded-md px-2 text-[12.5px] text-muted-foreground hover:bg-accent'

/**
 * The studio's band under a page's icon: who is here, quiet buttons to add what the page lacks,
 * a row's properties, and the pickers. The cover and icon themselves are the page's (D64).
 */
export function PageChrome({ pageId }: PageChromeProps) {
  const sheet = useSheetsStore((state) => state.sheets.find((entry) => entry.id === pageId))
  const open = useLookPickerStore((state) => state.open)
  // A picker belongs to the page it was opened on.
  useEffect(() => useLookPickerStore.getState().close, [pageId])
  if (!sheet) return null

  const picker = useLookPickerStore.getState()
  const update = useSheetsStore.getState().updateMeta
  const pick = (patch: SheetMetaPatch) => {
    picker.close()
    void update(sheet.id, patch)
  }

  return (
    <>
      <div className="absolute top-2 right-0 flex items-center gap-3 max-md:static max-md:flex-wrap max-md:pt-2 max-md:empty:hidden">
        <PagePresence sheetId={sheet.id} />
        <WashiMark sheet={sheet} />
      </div>
      <div
        className={`flex h-9 items-center gap-1 opacity-0 focus-within:opacity-100 group-hover/sheet:opacity-100 max-md:opacity-100 ${
          sheet.icon || sheet.cover ? '' : 'pt-4'
        }`}
      >
        {!sheet.icon && (
          <button
            type="button"
            onClick={(event) => picker.show('icon', event.currentTarget)}
            className={QUIET_BUTTON}
          >
            <IconMoodSmile className="size-4" />
            Add icon
          </button>
        )}
        {!sheet.cover && (
          <button
            type="button"
            onClick={(event) => picker.show('cover', event.currentTarget)}
            className={QUIET_BUTTON}
          >
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
      {sheet.rowOf && <RowProperties sheetId={sheet.id} />}
      {open?.part === 'icon' && (
        <IconPicker
          anchor={open.anchor}
          current={sheet.icon}
          onClose={picker.close}
          onPick={(icon) => pick({ icon })}
        />
      )}
      {open?.part === 'cover' && (
        <CoverPicker
          anchor={open.anchor}
          current={sheet.cover}
          onClose={picker.close}
          onPick={(cover) => pick({ cover })}
        />
      )}
    </>
  )
}
