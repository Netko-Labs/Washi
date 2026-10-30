/** Every site (D118). */
export const ANY_HOST = '*'

const HOST = /^(?=.{1,253}$)([a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/

/**
 * One list entry as typed — an address, a host, `*.domain` or a bare `*` — as the list keeps it,
 * or null when it is none of those. Pure: whether a private name may be listed is the caller's say.
 */
export function hostEntry(raw: string): string | null {
  const entry = raw
    .trim()
    .toLowerCase()
    .replace(/^(https?|wss?):\/\//, '')
    .replace(/[/:?#].*$/, '')
  if (entry === ANY_HOST) return entry
  return HOST.test(entry.replace(/^\*\./, '')) ? entry : null
}

/** `*` is every host; `*.example.com` is example.com and every host under it, on a dot boundary. */
export function hostMatches(host: string, entries: readonly string[]): boolean {
  const bare = host.toLowerCase()
  return entries.some((entry) => {
    if (entry === ANY_HOST) return true
    if (!entry.startsWith('*.')) return bare === entry
    const domain = entry.slice(2)
    return bare === domain || bare.endsWith(`.${domain}`)
  })
}
