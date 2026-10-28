import { useMayChange } from './use-may-change'
import { useMemberNames } from './use-member-names'

/** Who added a thing, in words, and whether the person looking may change it. */
export function useStewardship() {
  const names = useMemberNames()
  const mayChange = useMayChange()
  return { madeBy: (id: string) => names.get(id) ?? 'someone', mayChange }
}
