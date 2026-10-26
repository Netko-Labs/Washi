import { createFileRoute } from '@tanstack/react-router'
import { SharedPage } from '@/components/shared-page'

export const Route = createFileRoute('/s/$workspaceId/$token')({
  ssr: false,
  head: () => ({ meta: [{ name: 'robots', content: 'noindex' }] }),
  component: SharedRoute,
})

function SharedRoute() {
  const { workspaceId, token } = Route.useParams()
  return <SharedPage workspaceId={workspaceId} token={token} />
}
