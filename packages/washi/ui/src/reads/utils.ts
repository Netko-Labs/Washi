import type { KeptRead, Reads } from './types'

/** The same string whatever order an object's keys were written in, so equal queries share. */
export function stableKey(value: unknown): string {
  return JSON.stringify(value, (_, part: unknown) =>
    part && typeof part === 'object' && !Array.isArray(part)
      ? Object.fromEntries(Object.entries(part).sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0)))
      : part,
  )
}

export function createReads(freshMs: number, now: () => number = Date.now): Reads {
  const kept = new Map<string, KeptRead>()
  const isFresh = (read: KeptRead) => read.settledAt === null || now() - read.settledAt < freshMs

  return {
    share<T>(key: string, ask: () => Promise<T>): Promise<T> {
      const known = kept.get(key)
      if (known && isFresh(known)) return known.answer as Promise<T>
      for (const [stale, read] of kept) if (!isFresh(read)) kept.delete(stale)
      const answer = ask()
      const read: KeptRead = { answer, settledAt: null }
      kept.set(key, read)
      answer.then(
        () => {
          read.settledAt = now()
        },
        () => {
          if (kept.get(key) === read) kept.delete(key)
        },
      )
      return answer
    },
    forget: () => kept.clear(),
  }
}
