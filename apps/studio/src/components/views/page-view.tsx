import { getRouteApi } from '@tanstack/react-router'
import { SheetView } from '@washi/ui'
import { FirstRunGate } from '@/components/first-run'
import { PageChrome } from '@/components/page-chrome'
import { useRouteTab } from '@/components/shell'

const workspaceRoute = getRouteApi('/w/$workspaceId')
const pageRoute = getRouteApi('/w/$workspaceId/p/$pageId')

export function PageView() {
  const { workspace } = workspaceRoute.useLoaderData()
  const { pageId } = pageRoute.useParams()
  useRouteTab(`note:${pageId}`)
  return (
    <FirstRunGate workspace={workspace}>
      <SheetView chrome={<PageChrome pageId={pageId} />} />
    </FirstRunGate>
  )
}
