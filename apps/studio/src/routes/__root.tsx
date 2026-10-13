import { createRootRouteWithContext } from '@tanstack/react-router'
import {
  APP_DESCRIPTION,
  APP_NAME,
  NotFound,
  RootDocument,
  type RouterContext,
} from '@/components/core/root'
import appCss from '@/styles.css?url'

export const Route = createRootRouteWithContext<RouterContext>()({
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { title: APP_NAME },
      { name: 'description', content: APP_DESCRIPTION },
    ],
    links: [
      { rel: 'stylesheet', href: appCss },
      { rel: 'icon', href: '/favicon.ico' },
    ],
  }),
  shellComponent: RootDocument,
  notFoundComponent: NotFound,
})
