import type { TurnLimits } from './lib'

/** The port never returned after an abort; the host closes the turn without it. */
export class TurnAbandonedError extends Error {
  constructor() {
    super('the turn did not stop when asked')
  }
}

/**
 * Ends a turn whose port went quiet (D114): aborted after `quietMs` without a word, unless a
 * question is waiting on a person, and given up on `graceMs` after any abort — Stop's too.
 */
export class TurnWatchdog {
  stalled = false
  private quiet: ReturnType<typeof setTimeout> | null = null
  private readonly abort: AbortController
  private readonly limits: TurnLimits
  private readonly isWaiting: () => boolean

  constructor(abort: AbortController, limits: TurnLimits, isWaiting: () => boolean) {
    this.abort = abort
    this.limits = limits
    this.isWaiting = isWaiting
    this.heard()
  }

  heard = (): void => {
    if (this.quiet) clearTimeout(this.quiet)
    if (this.abort.signal.aborted) return
    this.quiet = setTimeout(() => {
      if (this.isWaiting()) return this.heard()
      this.stalled = true
      this.abort.abort()
    }, this.limits.quietMs)
  }

  guard<T>(work: Promise<T>): Promise<T> {
    const { signal } = this.abort
    let grace: ReturnType<typeof setTimeout> | null = null
    let giveUp = () => {}
    return new Promise<T>((resolve, reject) => {
      giveUp = () => {
        grace = setTimeout(() => reject(new TurnAbandonedError()), this.limits.graceMs)
      }
      if (signal.aborted) giveUp()
      else signal.addEventListener('abort', giveUp, { once: true })
      work.then(resolve, reject)
    }).finally(() => {
      if (grace) clearTimeout(grace)
      signal.removeEventListener('abort', giveUp)
      this.dispose()
    })
  }

  dispose(): void {
    if (this.quiet) clearTimeout(this.quiet)
    this.quiet = null
  }
}
