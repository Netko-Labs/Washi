import { createFileRoute } from '@tanstack/react-router'
import { SignInPage } from '@/components/auth'
import { sameOriginPath } from '@/integrations/auth'

export const Route = createFileRoute('/sign-in')({
  ssr: false,
  head: () => ({ meta: [{ title: 'Sign in · Washi' }] }),
  // An agent's sign-in arrives with a signed OAuth query; every parameter is kept for it.
  validateSearch: (
    search: Record<string, unknown>,
  ): Record<string, unknown> & { redirect?: string } => ({
    ...search,
    redirect: sameOriginPath(search.redirect) ?? undefined,
  }),
  component: SignInPage,
})
