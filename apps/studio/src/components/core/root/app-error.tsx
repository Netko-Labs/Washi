import { type ErrorComponentProps, useRouter } from '@tanstack/react-router'
import { isStaleChunkError, useStaleRecovery } from '@/components/shared/stale-build'

const BUTTON =
  'rounded-xl border border-border bg-background px-5 py-2.5 font-medium text-[14px] hover:bg-accent'

/** The root error boundary: a gone chunk reloads once, then says so; anything else in words. */
export function AppError({ error, reset }: ErrorComponentProps) {
  const router = useRouter()
  const isReloading = useStaleRecovery(error)
  if (isReloading) return null

  const isStale = isStaleChunkError(error)
  const retry = () => {
    reset()
    void router.invalidate()
  }

  return (
    <main
      role="alert"
      className="mx-auto flex max-w-md flex-col items-center gap-3 px-6 py-24 text-center"
    >
      <h1 className="font-semibold text-2xl">
        {isStale ? 'Washi was just updated' : 'Something went wrong'}
      </h1>
      <p className="text-[14px] text-muted-foreground leading-relaxed">
        {isStale
          ? 'This tab still runs the version before it. Reload to open the new one.'
          : (error instanceof Error && error.message) || 'This screen could not be drawn.'}
      </p>
      <div className="mt-1 flex gap-2">
        {!isStale && (
          <button type="button" onClick={retry} className={BUTTON}>
            Try again
          </button>
        )}
        <button type="button" onClick={() => window.location.reload()} className={BUTTON}>
          Reload
        </button>
      </div>
    </main>
  )
}
