import type { WsxElement } from '@washi/wsx'
import { useEffect } from 'react'
import { useEditorStore } from '../editor-store'
import { toBlocks } from '../utils'

/** Once per page: later versions of the page are the editor's own saves coming back. */
export function useLoadBlocks(sheetId: string, root: WsxElement) {
  useEffect(() => {
    useEditorStore.getState().load(toBlocks(root))
  }, [sheetId])
}
