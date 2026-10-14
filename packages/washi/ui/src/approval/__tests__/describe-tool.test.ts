import { describe, expect, test } from 'bun:test'
import { describeTool } from '../lib'

const titles = (id: string) => (id === 's1' ? 'Trip to Kyoto' : null)
const said = (name: string, input: unknown) => {
  const { action, subject } = describeTool(name, input, titles)
  return subject ? `${action} ${subject}` : action
}

describe('tool calls read like a person asked', () => {
  test('pages', () => {
    expect(said('sheet_create', { title: 'Trip to Kyoto', source: '<Sheet/>' })).toBe(
      'Create a page Trip to Kyoto',
    )
    expect(said('sheet_replace', { id: 's1', source: '<Sheet/>' })).toBe(
      'Update the page Trip to Kyoto',
    )
    expect(said('sheet_get', { id: 's1' })).toBe('Read Trip to Kyoto')
  })

  test('tables name the row, not the mutation', () => {
    expect(
      said('db_mutate', {
        mutation: { kind: 'insert', table: 'places', data: { name: 'Fushimi Inari' } },
      }),
    ).toBe('Add “Fushimi Inari” to places')
    expect(said('db_mutate', { mutation: { kind: 'delete', table: 'places', where: [] } })).toBe(
      'Remove rows from places',
    )
    const define = describeTool(
      'db_define',
      { spec: { name: 'places', columns: [{ name: 'name' }, { name: 'area' }] } },
      titles,
    )
    expect(define.details).toEqual(['Columns: name, area'])
  })

  test('what leaves the workspace says so', () => {
    const fetch = describeTool('fetch_url', { url: 'https://kyoto.travel/en' }, titles)
    expect(`${fetch.action} ${fetch.subject}`).toBe('Visit kyoto.travel')
    expect(fetch.outbound).toBe(true)
    expect(describeTool('sheet_create', {}, titles).outbound).toBe(false)
  })

  test('a page draft carries its source for the preview', () => {
    expect(describeTool('sheet_create', { source: '<Sheet title="x" />' }, titles).preview).toBe(
      '<Sheet title="x" />',
    )
  })

  test('nothing developer-shaped leaks for an unknown tool', () => {
    expect(said('make_coffee', {})).toBe('make coffee')
  })
})
