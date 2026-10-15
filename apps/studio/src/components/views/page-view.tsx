import { getRouteApi } from '@tanstack/react-router'
import { SheetView } from '@washi/ui'
import { Backlinks } from '@/components/backlinks'
import { CommentsPanel } from '@/components/comments'
import { FirstRunGate } from '@/components/first-run'
import { PageChrome } from '@/components/page-chrome'
import { PageBody } from '@/components/page-editor'
import { useRouteTab } from '@/components/shell'

const workspaceRoute = getRouteApi('/w/$workspaceId')
const pageRoute = getRouteApi('/w/$workspaceId/p/$pageId')

export function PageView() {
  const { workspace } = workspaceRoute.useLoaderData()
  const { pageId } = pageRoute.useParams()
  useRouteTab(`note:${pageId}`)
  return (
    <FirstRunGate workspace={workspace}>
      <div className="flex min-h-0 flex-1">
        <SheetView
          chrome={<PageChrome pageId={pageId} />}
          footer={<Backlinks pageId={pageId} />}
          body={PageBody}
        />
        <CommentsPanel sheetId={pageId} />
      </div>
    </FirstRunGate>
  )
}
