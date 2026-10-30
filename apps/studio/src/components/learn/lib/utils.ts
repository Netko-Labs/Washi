import { RECIPES, type Recipe, SUMMARIES } from '@washi/paper/book'
import { PRIMITIVE_GROUPS } from '@washi/paper/registry'
import type { LearnGroup } from './types'
import { GROUP_LABELS, SEARCH_WORDS } from './values'

function contains(text: string, query: string): boolean {
  const needle = query.trim().toLowerCase()
  return !needle || text.toLowerCase().includes(needle)
}

function primitiveMatches(name: string, query: string): boolean {
  return contains(`${name} ${SUMMARIES[name] ?? ''} ${SEARCH_WORDS[name] ?? ''}`, query)
}

function recipeMatches(recipe: Recipe, query: string): boolean {
  return contains(`${recipe.title} ${recipe.why} ${recipe.uses.join(' ')}`, query)
}

/** The registry's groups, each keeping only the primitives the filter matches. */
export function learnGroups(query: string): LearnGroup[] {
  return Object.entries(PRIMITIVE_GROUPS)
    .map(([id, names]) => ({
      id,
      label: GROUP_LABELS[id] ?? id,
      names: names.filter((name) => primitiveMatches(name, query)),
    }))
    .filter((group) => group.names.length > 0)
}

export function learnRecipes(query: string): Recipe[] {
  return RECIPES.filter((recipe) => recipeMatches(recipe, query))
}

export function anchorOf(name: string): string {
  return `p-${name}`
}

export function recipeAnchorOf(id: string): string {
  return `r-${id}`
}

/** Every heading the nav links to, in page order; `recipes` is left out, its recipes stand for it. */
export function spiedAnchors(groups: LearnGroup[], recipes: Recipe[]): string[] {
  return [
    'basics',
    ...recipes.map((recipe) => recipeAnchorOf(recipe.id)),
    'limits',
    ...groups.flatMap((group) => group.names.map(anchorOf)),
  ]
}
