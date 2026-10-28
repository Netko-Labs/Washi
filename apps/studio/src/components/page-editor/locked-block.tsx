import { PaperProvider, SheetLookProvider, usePaperHost, useSheetLook, WsxView } from '@washi/paper'
import type { WsxElement } from '@washi/wsx'
import { useMemo } from 'react'
import { blockFrame, type LockedBlockProps, useEditorStore } from './lib'

/** Live blocks — databases, charts, canvases — move and delete whole; what is inside edits in place. */
export function LockedBlock({ block, rootProps }: LockedBlockProps) {
  const page = usePaperHost()
  const look = useSheetLook()
  // While the page is open for typing, a canvas writes into the editor, not past it to the server.
  const host = useMemo(
    () => ({
      ...page,
      replaceNode: async (from: WsxElement, to: WsxElement) =>
        useEditorStore.getState().replaceInBlock(block.id, from, to),
    }),
    [page, block.id],
  )

  return (
    <div
      className="page-editor-locked rounded-lg ring-1 ring-transparent ring-offset-4 ring-offset-transparent hover:ring-border"
      title="A live block: move or delete it here"
    >
      {/* Its frame is a page's too: without this it draws the page's band (cover, comments, Undo) again. */}
      <SheetLookProvider value={{ ...look, band: undefined, edit: undefined }}>
        <PaperProvider host={host}>
          <WsxView
            root={{
              kind: 'element',
              name: 'Sheet',
              props: blockFrame(rootProps),
              children: [block.node],
            }}
          />
        </PaperProvider>
      </SheetLookProvider>
    </div>
  )
}
