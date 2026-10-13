import { createFileRoute } from '@tanstack/react-router'

// Phase 3 mounts the ported web shell here.
export const Route = createFileRoute('/')({
  component: () => <main className="p-8 font-black text-2xl">Washi</main>,
})
