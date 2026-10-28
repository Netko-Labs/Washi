import { SUMMARIES } from '@washi/paper/book'
import { PRIMITIVE_GROUPS } from '@washi/paper/registry'
import type { LearnGroup } from './types'
import { GROUP_LABELS } from './values'

function matches(name: string, query: string): boolean {
  const needle = query.trim().toLowerCase()
  if (!needle) return true
  return `${name} ${SUMMARIES[name] ?? ''}`.toLowerCase().includes(needle)
}

/** The registry's groups, each keeping only the primitives the filter matches. */
export function learnGroups(query: string): LearnGroup[] {
  return Object.entries(PRIMITIVE_GROUPS)
    .map(([id, names]) => ({
      id,
      label: GROUP_LABELS[id] ?? id,
      names: names.filter((name) => matches(name, query)),
    }))
    .filter((group) => group.names.length > 0)
}

export function anchorOf(name: string): string {
  return `p-${name}`
}
