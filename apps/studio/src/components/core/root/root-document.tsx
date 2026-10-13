import { HeadContent, Scripts, useRouter } from '@tanstack/react-router'
import { Provider } from '@/integrations/tanstack-query'
import type { RootDocumentProps } from './lib'

export function RootDocument({ children }: RootDocumentProps) {
  // The router's QueryClient; on the server that is one per request.
  const { queryClient } = useRouter().options.context
  return (
    <Provider queryClient={queryClient}>
      <html lang="en">
        <head>
          <HeadContent />
        </head>
        <body className="min-h-dvh bg-background font-sans text-[14px] text-foreground">
          {children}
          <Scripts />
        </body>
      </html>
    </Provider>
  )
}
