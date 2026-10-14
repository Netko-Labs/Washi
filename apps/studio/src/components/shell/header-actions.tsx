import { noteIdOf, useSheetsStore, useViewStore } from '@washi/ui'
import { PageMenu } from '@/components/page-menu'
import { CopyLinkButton } from './copy-link-button'

export function HeaderActions() {
  const pageId = useViewStore((state) => noteIdOf(state.activeTab))
  const sheet = useSheetsStore((state) => state.sheets.find((entry) => entry.id === pageId))

  return (
    <>
      <CopyLinkButton />
      {sheet && <PageMenu sheet={sheet} />}
    </>
  )
}
