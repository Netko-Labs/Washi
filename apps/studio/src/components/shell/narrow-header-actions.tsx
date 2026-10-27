import { noteIdOf, useSheetsStore, useViewStore } from '@washi/ui'
import { MarkAllRead } from '@/components/mentions'
import { EditToggle } from '@/components/page-editor'
import { PageMenu } from '@/components/page-menu'

/** A phone's header keeps Edit and ⋯; comments, share, copy link and the star are inside ⋯. */
export function NarrowHeaderActions() {
  const pageId = useViewStore((state) => noteIdOf(state.activeTab))
  const sheet = useSheetsStore((state) => state.sheets.find((entry) => entry.id === pageId))

  return (
    <>
      {sheet && <EditToggle sheetId={sheet.id} />}
      <MarkAllRead />
      {sheet && <PageMenu sheet={sheet} compact />}
    </>
  )
}
