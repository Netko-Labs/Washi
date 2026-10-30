import { describe, expect, test } from 'bun:test'
import { RECIPES, SUMMARIES } from '@washi/paper/book'
import { learnGroups, learnRecipes, spiedAnchors } from '../utils'
import { SEARCH_SUGGESTIONS, SEARCH_WORDS } from '../values'

const primitivesFor = (query: string) => learnGroups(query).flatMap((group) => group.names)
const recipesFor = (query: string) => learnRecipes(query).map((recipe) => recipe.id)

describe('the learn search', () => {
  test('an empty query keeps everything', () => {
    expect(primitivesFor('  ').sort()).toEqual(Object.keys(SUMMARIES).sort())
    expect(recipesFor('')).toEqual(RECIPES.map((recipe) => recipe.id))
  })

  test('a newcomer’s word finds the primitive it means', () => {
    expect(primitivesFor('kanban')).toContain('Board')
    expect(primitivesFor('Calendar')).toContain('Agenda')
    expect(primitivesFor('booking')).toContain('Slots')
    expect(primitivesFor('graph')).toContain('Chart')
    expect(primitivesFor('survey')).toContain('Form')
  })

  test('recipes match on their title, their why and the primitives they use', () => {
    expect(recipesFor('kanban')).toEqual(['kanban'])
    expect(recipesFor('modal')).toContain('week')
    expect(recipesFor('bento')).toEqual(['home'])
  })

  test('a query that matches nothing finds nothing, and the suggestions do', () => {
    expect(primitivesFor('zzzz')).toEqual([])
    expect(recipesFor('zzzz')).toEqual([])
    for (const name of SEARCH_SUGGESTIONS) expect(primitivesFor(name)).toContain(name)
  })

  test('every searched word names a real primitive', () => {
    for (const name of Object.keys(SEARCH_WORDS)) expect(SUMMARIES[name]).toBeDefined()
  })

  test('the scroll-spy follows the page order, recipes before limits', () => {
    const anchors = spiedAnchors(learnGroups('board'), learnRecipes('board'))
    expect(anchors[0]).toBe('basics')
    expect(anchors).toContain('r-kanban')
    expect(anchors.indexOf('limits')).toBeLessThan(anchors.indexOf('p-Board'))
  })
})
