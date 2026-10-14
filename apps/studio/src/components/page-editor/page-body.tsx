import { WsxView } from '@washi/paper'
import { type PageBodyProps, useEditorStore } from './lib'
import { PageEditor } from './page-editor'

export function PageBody({ sheet, root }: PageBodyProps) {
  const isEditing = useEditorStore((state) => state.editingId === sheet.id)
  return isEditing ? (
    <PageEditor key={sheet.id} sheet={sheet} root={root} />
  ) : (
    <WsxView key={sheet.id} root={root} />
  )
}
