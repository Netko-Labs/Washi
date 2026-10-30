import { useRouterState } from '@tanstack/react-router'
import { useSheetsStore } from '@washi/ui'
import { peekOf } from '@/components/row-peek'
import { titleIn } from '../utils'
import { useScreen } from './use-screen'

/** `<page> · <workspace>`; a row peeked over it, `<row> · <page> · <workspace>`. */
export function usePageScreen(pageId: string): void {
  const peekId = useRouterState({ select: (state) => peekOf(state.location.searchStr) })
  const page = useSheetsStore((state) => titleIn(state.sheets, pageId))
  const row = useSheetsStore((state) => (peekId ? titleIn(state.sheets, peekId) : null))
  useScreen(`note:${pageId}`, row === null ? [page] : [row, page])
}
