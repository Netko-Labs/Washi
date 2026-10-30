import type { Choice } from '../types'
import { useRelationTitles } from './use-relation-titles'

/** The rows a relation can point at, by their titles; none while loading or when unreadable. */
export function useRelationChoices(target: string | undefined): Choice[] {
  const titles = useRelationTitles(target ? [target] : [])
  return (target && titles[target]) || []
}
