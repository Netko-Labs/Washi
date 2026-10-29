/**
 * One value per process, whichever bundled copy of a module asks for it. The studio ships its
 * server packages twice — Nitro's entry, where the runtime boots, and the SSR router, where
 * tRPC runs — so a registry kept in a plain module variable splits in two and loses what the
 * other copy set. Keyed on `Symbol.for`, both copies reach the same one.
 */
export function processSingleton<T>(key: string, make: () => T): T {
  const slots = globalThis as unknown as Record<symbol, T | undefined>
  const slot = Symbol.for(`washi.${key}`)
  slots[slot] ??= make()
  return slots[slot]
}
