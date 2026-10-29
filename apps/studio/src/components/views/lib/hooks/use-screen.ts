import type { TabKey } from '@washi/ui'
import { type TitlePart, useDocumentTitle } from '@/components/shared/document-title'
import { useRouteTab } from '@/components/shell'

/** A view marks its tab in the shell and names the browser's (D112). */
export function useScreen(tab: TabKey, title: readonly TitlePart[]): void {
  useRouteTab(tab)
  useDocumentTitle(title)
}
