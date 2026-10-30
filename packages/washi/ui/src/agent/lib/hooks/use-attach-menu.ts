import type { SheetSummary } from '@washi/domain'
import { type KeyboardEvent, useRef, useState } from 'react'
import { useSheetsStore } from '../../../stores'
import type { AttachMenuProps, PageSearch } from '../types'
import { pagesMatching } from '../utils'
import { useAttachDismiss } from './use-attach-dismiss'

/** The menu, then its page picker as a combobox: the first match lit, arrows move, Enter picks. */
export function useAttachMenu({ onPage, onClose }: Pick<AttachMenuProps, 'onPage' | 'onClose'>) {
  const sheets = useSheetsStore((state) => state.sheets)
  const [search, setSearch] = useState<PageSearch | null>(null)
  const root = useRef<HTMLDivElement>(null)
  useAttachDismiss(root, onClose)

  const pages = search ? pagesMatching(sheets, search.term) : []
  const active = Math.min(search?.active ?? 0, Math.max(0, pages.length - 1))

  const pick = (sheet: SheetSummary) => {
    onPage({ kind: 'page', id: sheet.id, name: sheet.title })
    onClose()
  }

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    // Enter confirms the input method's conversion (kana → kanji) while it is composing.
    if (event.nativeEvent.isComposing) return
    const step = { ArrowDown: 1, ArrowUp: -1 }[event.key]
    if (step && pages.length > 0) {
      event.preventDefault()
      setSearch({ term: search?.term ?? '', active: (active + step + pages.length) % pages.length })
    } else if (event.key === 'Enter') {
      event.preventDefault()
      const sheet = pages[active]
      if (sheet) pick(sheet)
    }
  }

  return {
    root,
    search,
    pages,
    active,
    pick,
    onKeyDown,
    open: () => setSearch({ term: '', active: 0 }),
    setTerm: (term: string) => setSearch({ term, active: 0 }),
    hover: (index: number) => setSearch({ term: search?.term ?? '', active: index }),
  }
}
