/** Where a page's `useStored` keeps a key: the reader's own browser, per page. */
export const storedKey = (page: string | undefined, key: string) =>
  page ? `washi:stored:${page}:${key}` : `memory:${key}`

// A page with no id (the book's stage) has nothing to keep a value under: it lasts the visit.
const unkept = new Map<string, string>()

export function readStored(key: string): string | undefined {
  if (key.startsWith('memory:')) return unkept.get(key)
  try {
    return localStorage.getItem(key) ?? undefined
  } catch {
    return undefined
  }
}

export function writeStored(key: string, json: string) {
  if (key.startsWith('memory:')) {
    unkept.set(key, json)
    return
  }
  try {
    localStorage.setItem(key, json)
  } catch {
    // Storage full or off: the value lives until the page closes, like any page state.
  }
}
