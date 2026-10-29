import type { Titled } from './types'

/** Null until the list holds it: a title still loading, never the last screen's. */
export function titleIn(list: readonly Titled[], id: string): string | null {
  return list.find((each) => each.id === id)?.title ?? null
}
