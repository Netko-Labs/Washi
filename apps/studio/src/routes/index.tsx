import { createFileRoute } from '@tanstack/react-router'
import { HomeRedirect } from '@/components/home'

// Session and the last workspace live in the browser (cookie, localStorage).
export const Route = createFileRoute('/')({
  ssr: false,
  component: HomeRedirect,
})
