import { createFileRoute } from '@tanstack/react-router'
import { SignInPage } from '@/components/auth'

export const Route = createFileRoute('/sign-in')({
  ssr: false,
  validateSearch: (search: Record<string, unknown>): { redirect?: string } => ({
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
