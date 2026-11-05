import { createFileRoute } from '@tanstack/react-router'
import { SharedPage } from '@/components/shared-page'

export const Route = createFileRoute('/s/$workspaceId/$token')({
  ssr: false,
  // A sub-page the link opens (D123); anything else reads as the link's own page.
  validateSearch: (search: Record<string, unknown>): { page?: string } =>
    typeof search.page === 'string' && search.page.length <= 64 ? { page: search.page } : {},
  head: () => ({ meta: [{ name: 'robots', content: 'noindex' }] }),
  component: SharedRoute,
})

function SharedRoute() {
  const { workspaceId, token } = Route.useParams()
  const { page } = Route.useSearch()
  return <SharedPage workspaceId={workspaceId} token={token} page={page} />
}
