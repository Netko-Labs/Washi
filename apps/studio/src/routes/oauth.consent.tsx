import { createFileRoute } from '@tanstack/react-router'
import { ConsentPage } from '@/components/oauth-consent'

/** Where an agent's sign-in asks the person (D101); the signed query is kept whole for it. */
export const Route = createFileRoute('/oauth/consent')({
  ssr: false,
  validateSearch: (search: Record<string, unknown>) => search,
  component: function Consent() {
    const search = Route.useSearch()
    return <ConsentPage clientId={typeof search.client_id === 'string' ? search.client_id : null} />
  },
})
