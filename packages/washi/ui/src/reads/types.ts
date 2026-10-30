export interface Reads {
  /** One request per key while it is asked or fresh; a failed one is not kept. */
  share<T>(key: string, ask: () => Promise<T>): Promise<T>
  forget(): void
}

export interface KeptRead {
  answer: Promise<unknown>
  settledAt: number | null
}
