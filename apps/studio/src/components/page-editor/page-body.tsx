import { WsxView } from '@washi/paper'
import { useSheetsStore } from '@washi/ui'
import { useEffect } from 'react'
import { type PageBodyProps, useEditorStore } from './lib'
import { PageEditor } from './page-editor'
import { SourceEditor } from './source-editor'

export function PageBody({ sheet, root }: PageBodyProps) {
  const mode = useEditorStore((state) => (state.editingId === sheet.id ? state.mode : null))

  // A page just made opens ready to type, the caret in its heading — as in Notion.
  useEffect(() => {
    if (useSheetsStore.getState().takeFresh(sheet.id)) {
      useEditorStore.getState().startEditing(sheet.id, true)
    }
  }, [sheet.id])

  if (mode === 'source') return <SourceEditor key={sheet.id} sheet={sheet} />
  if (mode === 'blocks') return <PageEditor key={sheet.id} sheet={sheet} root={root} />
  return <WsxView key={sheet.id} root={root} />
}
