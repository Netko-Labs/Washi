import { PaperProvider } from '@washi/paper'
import { MascotDefs, Notice, useNoticeStore } from '@washi/ui'
import { useMemo } from 'react'
import { Knobs } from '@/components/knobs'
import { Rail } from '@/components/rail'
import { createBookHost } from '@/components/shared/host'
import { Stage } from '@/components/stage'
import { Topbar } from '@/components/topbar'
import { useDocumentSync } from './lib'

export function App() {
  const host = useMemo(
    () => createBookHost((message) => useNoticeStore.getState().say(message)),
    [],
  )
  useDocumentSync()

  return (
    <PaperProvider host={host}>
      <MascotDefs />
      <div className="grid h-full grid-cols-[224px_minmax(0,1fr)_312px] grid-rows-[auto_minmax(0,1fr)]">
        <Topbar />
        <Rail />
        <Stage />
        <Knobs />
      </div>
      <Notice />
    </PaperProvider>
  )
}
