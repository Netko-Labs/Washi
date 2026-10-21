import { exaSearch } from '@washi/tsuru'
import type { SearchKeyLookup } from './lib'
import { SEARCH_NOT_SET } from './lib'

/** One search for both ports: the workspace's Exa key, or a message that says where it goes. */
export async function webSearch(
  lookup: SearchKeyLookup | undefined,
  query: string,
  count?: number,
) {
  const apiKey = await lookup?.()
  if (!apiKey) throw new Error(SEARCH_NOT_SET)
  return exaSearch({ query, count, apiKey })
}
