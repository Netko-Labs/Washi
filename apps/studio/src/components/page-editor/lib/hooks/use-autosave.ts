import type { SheetDetail } from '@washi/domain'
import { useSheetsStore } from '@washi/ui'
import { parse, serialize, type WsxElement } from '@washi/wsx'
import { useEffect } from 'react'
import { api } from '@/integrations/trpc'
import { SAVE_DELAY_MS } from '../constants'
import { useEditorStore } from '../editor-store'
import { toBlocks, toSheet } from '../utils'

/** A pause in typing saves the page; leaving the editor saves whatever is still pending. */
export function useAutosave(sheet: SheetDetail, root: WsxElement) {
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined

    const save = async () => {
      timer = undefined
      const { blocks, version, setSaveState } = useEditorStore.getState()
      const current = useSheetsStore.getState().sheets.find((entry) => entry.id === sheet.id)
      const source = serialize(toSheet(root, blocks))
      setSaveState('saving')
      try {
        const saved = await api.sheets.update.mutate({
          id: sheet.id,
          write: {
            title: current?.title ?? sheet.title,
            icon: current?.icon ?? sheet.icon,
            tags: current?.tags ?? sheet.tags,
            source,
          },
          baseVersion: version ?? undefined,
        })
        const editor = useEditorStore.getState()
        // Someone wrote in between and the server merged: take the merged page in, unless this
        // person has typed again since — their next save merges that too.
        if (saved.source !== source && editor.blocks === blocks) {
          editor.absorb(toBlocks(parse(saved.source)), saved.version ?? null, saved.source)
        } else {
          useEditorStore.setState({ version: saved.version ?? null, savedSource: saved.source })
        }
        setSaveState('saved')
        void useSheetsStore.getState().refresh()
      } catch {
        setSaveState('failed')
      }
    }

    const unsubscribe = useEditorStore.subscribe((state, previous) => {
      if (state.blocks === previous.blocks || previous.blocks.length === 0) return
      clearTimeout(timer)
      timer = setTimeout(() => void save(), SAVE_DELAY_MS)
    })
    return () => {
      unsubscribe()
      if (timer) {
        clearTimeout(timer)
        void save()
      }
    }
  }, [sheet.id])
}
