import { noteIdOf, useSheetsStore, useViewStore } from '@washi/ui'
import { CommentsButton } from '@/components/comments'
import { MarkAllRead } from '@/components/mentions'
import { EditToggle } from '@/components/page-editor'
import { PageMenu } from '@/components/page-menu'
import { ShareButton } from '@/components/share'
import { CopyLinkButton } from './copy-link-button'

export function HeaderActions() {
  const pageId = useViewStore((state) => noteIdOf(state.activeTab))
  const sheet = useSheetsStore((state) => state.sheets.find((entry) => entry.id === pageId))

  return (
    <>
      {sheet && <CommentsButton sheetId={sheet.id} />}
      {sheet && <EditToggle sheetId={sheet.id} />}
      <MarkAllRead />
      {sheet && <ShareButton sheet={sheet} />}
      <CopyLinkButton />
      {sheet && <PageMenu sheet={sheet} />}
    </>
  )
}
