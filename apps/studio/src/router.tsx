import { createRouter } from '@tanstack/react-router'
import { NotFound } from '@/components/core/root'
import { getContext } from '@/integrations/tanstack-query'
import { routeTree } from './routeTree.gen'

export const getRouter = () => {
  const { queryClient } = getContext()
  return createRouter({
    routeTree,
    scrollRestoration: true,
    defaultPreloadStaleTime: 0,
    defaultNotFoundComponent: NotFound,
    context: { queryClient },
  })
}
