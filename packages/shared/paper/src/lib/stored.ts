/** Where a page's `useStored` keeps a key: the reader's own browser, per page. */
export const storedKey = (page: string | undefined, key: string) =>
  `washi:stored:${page ?? 'page'}:${key}`

export function readStored(key: string): string | undefined {
  try {
    return localStorage.getItem(key) ?? undefined
  } catch {
    return undefined
  }
}

export function writeStored(key: string, json: string) {
  try {
    localStorage.setItem(key, json)
  } catch {
    // Storage full or off: the value lives until the page closes, like any page state.
  }
}
