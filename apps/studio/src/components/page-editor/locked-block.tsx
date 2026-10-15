import { PaperProvider, usePaperHost, WsxView } from '@washi/paper'
import type { WsxElement } from '@washi/wsx'
import { useMemo } from 'react'
import { type LockedBlockProps, useEditorStore } from './lib'

/** Live blocks — databases, charts, canvases — move and delete whole; what is inside edits in place. */
export function LockedBlock({ block, rootProps }: LockedBlockProps) {
  const page = usePaperHost()
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
      <PaperProvider host={host}>
        <WsxView
          root={{ kind: 'element', name: 'Sheet', props: rootProps, children: [block.node] }}
        />
      </PaperProvider>
    </div>
  )
}
