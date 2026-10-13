import { createFileRoute } from '@tanstack/react-router'
import { App } from '@/components/app'

// Session, workspace choice and the shell all read browser state (cookie, localStorage).
export const Route = createFileRoute('/')({
  ssr: false,
  component: App,
})
