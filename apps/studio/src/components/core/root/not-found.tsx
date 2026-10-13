import { Link } from '@tanstack/react-router'

export function NotFound() {
  return (
    <main className="mx-auto max-w-md px-6 py-24 text-center">
      <h1 className="font-black text-2xl">Nothing here</h1>
      <Link to="/" className="mt-4 inline-block text-primary underline">
        Back to Washi
      </Link>
    </main>
  )
}
