import { getRouteApi, Navigate } from '@tanstack/react-router'
import { useSession } from '@/integrations/auth'
import { AuthScreen } from './auth-screen'

const route = getRouteApi('/sign-in')

/** Sign in, then back to wherever the link pointed — a shared page URL survives the detour. */
export function SignInPage() {
  const { redirect } = route.useSearch()
  const { data: session, isPending } = useSession()
  if (isPending) return null
  if (session) return <Navigate to={redirect ?? '/'} />
  return <AuthScreen onDone={() => window.location.assign(redirect ?? '/')} />
}
