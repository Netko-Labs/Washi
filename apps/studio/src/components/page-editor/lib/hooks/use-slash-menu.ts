import { acceptFor } from '@washi/domain'
import { useNoticeStore, useSheetsStore } from '@washi/ui'
import { type RefObject, useState } from 'react'
import { useUnsplashPickStore } from '@/components/shared/unsplash'
import { NO_SHEETS, NO_TABLES, PICKER_KINDS, SLASH_START as START } from '../constants'
import { useEditorStore } from '../editor-store'
import { isNestedBlock } from '../slots'
import type { DataPick, SlashMenuState, SlashNav, SlashOption, TextBlock } from '../types'
import { pickFiles, slashMatches } from '../utils'

/** An upload's picker opens inside the press that chose it; the block lands once it is stored. */
function landingOf(chosen: DataPick, field: HTMLTextAreaElement | null): Promise<DataPick | null> {
  if (chosen.kind === 'upload') {
    return pickFiles(acceptFor(chosen.as)).then(([file]) => (file ? { ...chosen, file } : null))
  }
  if (chosen.kind === 'gallery') {
    return pickFiles(acceptFor('image'), true).then((files) =>
      files.length > 0 ? { ...chosen, files } : null,
    )
  }
  if (chosen.kind === 'unsplash' && field) {
    return useUnsplashPickStore
      .getState()
      .ask(field)
      .then((photo) => (photo ? { ...chosen, photo } : null))
  }
  return Promise.resolve(chosen)
}

/** Typed `/` in a block: what it offers, the row the arrows light, and the step it is on. */
export function useSlashMenu(
  block: TextBlock,
  field: RefObject<HTMLTextAreaElement | null>,
): SlashMenuState {
  const query = block.text.startsWith('/') ? block.text.slice(1) : null
  const tables = useEditorStore((state) => (query === null ? NO_TABLES : state.tables))
  const sheets = useSheetsStore((state) => (query === null ? NO_SHEETS : state.sheets))
  const [nav, setNav] = useState(START)
  const store = useEditorStore.getState
  const step = query === null ? null : nav.step
  const options =
    query === null
      ? []
      : slashMatches(query, {
          tables,
          pages: sheets.filter((sheet) => !sheet.rowOf),
          isNested: isNestedBlock(store().blocks, block.id),
          step,
          selfId: store().editingId,
        })
  const active = nav.query === query ? Math.min(nav.active, Math.max(options.length - 1, 0)) : 0

  const open = (next: SlashNav['step']) => {
    setNav({ step: next, active: 0, query: '' })
    store().setText(block.id, '/')
  }

  const pick = (option: SlashOption) => {
    if (option.type === 'step') return open(option.step)
    if (option.type === 'text') {
      setNav(START)
      store().turnInto(block.id, option.kind)
      store().setText(block.id, '')
      return
    }
    // A refused name (taken since the menu loaded) keeps its `/` text to retype; a picker's goes.
    const typed = block.text
    const letGo = () => PICKER_KINDS.has(option.pick.kind) && store().dropSlash(block.id, typed)
    landingOf(option.pick, field.current)
      .then((landing) => (landing ? store().insertData(block.id, landing) : letGo()))
      .catch((cause: unknown) => {
        letGo()
        useNoticeStore
          .getState()
          .say(`That did not land — ${cause instanceof Error ? cause.message : String(cause)}`)
      })
  }

  return {
    query,
    step,
    options,
    active,
    pick,
    back: () => open(null),
    hover: (index) => setNav({ ...nav, active: index, query: query ?? '' }),
    onText: (value) => {
      if (!value.startsWith('/') || !block.text.startsWith('/')) setNav(START)
    },
    onKeyDown: (event) => {
      if (query === null) return false
      const count = options.length
      if ((event.key === 'ArrowDown' || event.key === 'ArrowUp') && count > 0) {
        event.preventDefault()
        const next = (active + (event.key === 'ArrowDown' ? 1 : -1) + count) % count
        setNav({ ...nav, active: next, query })
        return true
      }
      const chosen = options[active]
      if (event.key === 'Enter' && !event.shiftKey && block.kind !== 'code' && chosen) {
        event.preventDefault()
        pick(chosen)
        return true
      }
      if (event.key === 'Escape' || (event.key === 'Backspace' && step && query === '')) {
        event.preventDefault()
        if (step) open(null)
        else store().setText(block.id, '')
        return true
      }
      return false
    },
  }
}
