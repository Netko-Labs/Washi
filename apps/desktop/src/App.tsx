import { useEffect, useState } from 'react'
import { api } from './lib/rpc'

export function App() {
  const [pong, setPong] = useState<string | null>(null)

  useEffect(() => {
    api
      .ping({})
      .then(setPong)
      .catch(() => setPong(null))
  }, [])

  return (
    <div className="flex h-dvh flex-col bg-background text-foreground">
      <header
        className="h-9 shrink-0 border-border border-b"
        style={{ appRegion: 'drag' } as never}
      >
        <div className="flex h-full items-center justify-center font-medium text-muted-foreground text-xs">
          Washi
        </div>
      </header>
      <main className="grid flex-1 place-items-center">
        <div className="text-center">
          <h1 className="font-bold text-4xl tracking-tight">washi。</h1>
          <p className="mt-2 text-muted-foreground text-sm">
            {pong === 'pong' ? 'main process connected' : 'connecting…'}
          </p>
        </div>
      </main>
    </div>
  )
}
