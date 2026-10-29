import { createFileRoute } from '@tanstack/react-router'
import { SignInPage } from '@/components/auth'

export const Route = createFileRoute('/sign-in')({
  ssr: false,
  // An agent's sign-in arrives with a signed OAuth query; every parameter is kept for it.
  validateSearch: (
    search: Record<string, unknown>,
  ): Record<string, unknown> & { redirect?: string } => ({
    ...search,
    // Same-origin paths only: a sign-in link must never bounce somewhere else.
    redirect:
      typeof search.redirect === 'string' &&
      search.redirect.startsWith('/') &&
      !search.redirect.startsWith('//')
        ? search.redirect
        : undefined,
  }),
  component: SignInPage,
})
