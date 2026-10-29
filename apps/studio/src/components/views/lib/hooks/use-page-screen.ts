import { getRouteApi, useRouterState } from '@tanstack/react-router'
import { useSheetsStore } from '@washi/ui'
import { peekOf } from '@/components/row-peek'
import { titleIn } from '../utils'
import { useScreen } from './use-screen'

const workspaceRoute = getRouteApi('/w/$workspaceId')

/** `<page> · <workspace>`; a row peeked over it, `<row> · <page>`. */
export function usePageScreen(pageId: string): void {
  const workspaceName = workspaceRoute.useLoaderData({ select: (data) => data.workspace.name })
  const peekId = useRouterState({ select: (state) => peekOf(state.location.searchStr) })
  const page = useSheetsStore((state) => titleIn(state.sheets, pageId))
  const row = useSheetsStore((state) => (peekId ? titleIn(state.sheets, peekId) : null))
  useScreen(`note:${pageId}`, row === null ? [page, workspaceName] : [row, page ?? workspaceName])
}
