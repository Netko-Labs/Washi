import { describe, expect, test } from 'bun:test'
import { paperRegistry } from '../../../registry'
import { compileSheet, pageLimits, placementOf, propRows, RECIPES, SUMMARIES } from '..'

describe('the guide', () => {
  test('every primitive has a summary, and nothing is summarised that does not exist', () => {
    const names = Object.keys(paperRegistry.components).sort()
    expect(Object.keys(SUMMARIES).sort()).toEqual(names)
  })

  test('every recipe is a page the server would take', () => {
    for (const recipe of RECIPES) {
      const compiled = compileSheet(recipe.source)
      expect({ id: recipe.id, errors: compiled.errors }).toEqual({ id: recipe.id, errors: [] })
      for (const name of recipe.uses) expect(paperRegistry.components[name]).toBeDefined()
    }
  })

  test('props read in words, off the spec', () => {
    const agenda = Object.fromEntries(propRows('Agenda').map((row) => [row.key, row]))
    expect(agenda.view?.type).toBe('week · month')
    expect(agenda.bind?.required).toBe(true)
    expect(agenda.addLabel?.type).toBe('text ≤ 40')
    expect(agenda.tone?.styled).toBe(true)
  })

  test('placement and limits come from the registry', () => {
    expect(placementOf('Item').within).toEqual(['List'])
    expect(placementOf('Mascot').unique).toBe(true)
    const text = pageLimits()
      .map((limit) => limit.detail)
      .join('\n')
    expect(text).toContain('Item in List')
    expect(text).toContain('512 characters')
  })
})
