import { WsxView } from '@washi/paper'
import { useSheetsStore } from '@washi/ui'
import { useEffect } from 'react'
import { type PageBodyProps, useEditorStore } from './lib'
import { PageEditor } from './page-editor'

export function PageBody({ sheet, root }: PageBodyProps) {
  const isEditing = useEditorStore((state) => state.editingId === sheet.id)

  // A page just made opens ready to type, the caret in its heading — as in Notion.
  useEffect(() => {
    if (useSheetsStore.getState().takeFresh(sheet.id)) {
      useEditorStore.getState().startEditing(sheet.id, true)
    }
  }, [sheet.id])

  return isEditing ? (
    <PageEditor key={sheet.id} sheet={sheet} root={root} />
  ) : (
    <WsxView key={sheet.id} root={root} />
  )
}
