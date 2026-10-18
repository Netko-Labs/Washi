import type { SheetDetail } from '@washi/domain'
import { useSheetsStore } from '@washi/ui'
import { useEffect } from 'react'
import { api } from '@/integrations/trpc'
import { SAVE_DELAY_MS, useEditorStore } from '../../../lib'
import { useSourceStore } from '../source-store'
import { isSavable } from '../utils'

/** A pause in typing saves a valid draft; a draft with errors waits, and says so. */
export function useSourceSave(sheet: SheetDetail) {
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined

    const save = async () => {
      timer = undefined
      const { draft, version } = useSourceStore.getState()
      const { setSaveState } = useEditorStore.getState()
      const current = useSheetsStore.getState().sheets.find((entry) => entry.id === sheet.id)
      setSaveState('saving')
      try {
        const saved = await api.sheets.update.mutate({
          id: sheet.id,
          write: {
            title: current?.title ?? sheet.title,
            icon: current?.icon ?? sheet.icon,
            tags: current?.tags ?? sheet.tags,
            source: draft,
          },
          baseVersion: version ?? undefined,
        })
        const store = useSourceStore.getState()
        if (saved.source !== draft && store.draft === draft) {
          store.absorb(saved.source, saved.version ?? null)
        } else {
          store.markSaved(saved.source, saved.version ?? null)
        }
        setSaveState('saved')
        void useSheetsStore.getState().refresh()
      } catch {
        setSaveState('failed')
      }
    }

    const unsubscribe = useSourceStore.subscribe((state, previous) => {
      if (state.draft === previous.draft || state.revision !== previous.revision) return
      clearTimeout(timer)
      timer = undefined
      if (isSavable(state.diagnostics)) {
        timer = setTimeout(() => void save(), SAVE_DELAY_MS)
      } else {
        useEditorStore.getState().setSaveState('invalid')
      }
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
