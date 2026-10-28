import { createFileRoute } from '@tanstack/react-router'
import { Learn } from '@/components/learn'

export const Route = createFileRoute('/learn')({
  ssr: false,
  head: () => ({ meta: [{ title: 'Page primitives · Washi' }] }),
  component: Learn,
})
