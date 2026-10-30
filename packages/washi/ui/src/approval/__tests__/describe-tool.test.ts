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
    expect(said('sheet_delete', { id: 's1' })).toBe('Moved “Trip to Kyoto” to the trash')
    expect(said('sheet_delete', { id: 'gone' })).toBe('Moved a page to the trash')
    const reloaded = describeTool(
      'sheet_delete',
      { id: 'gone' },
      titles,
      '{"id":"gone","title":"Old notes","pages":1}',
    )
    expect(reloaded.action).toBe('Moved “Old notes” to the trash')
    expect(said('set_conversation_title', { title: 'Lisbon plan' })).toBe(
      'Named the chat Lisbon plan',
    )
    expect(said('chat_handover', { sheetId: 's1' })).toBe('Moved this chat to Trip to Kyoto')
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
    const copy = describeTool(
      'db_mutate',
      {
        mutation: {
          kind: 'copy',
          table: 'expenses',
          where: [{ column: 'recurring', op: 'eq', value: true }],
          set: { date: { expr: 'next_date' }, paid: false },
        },
      },
      titles,
    )
    expect(copy.action).toBe('Copy rows forward in')
    expect(copy.details).toEqual(['Each copy changes date, paid'])
    const define = describeTool(
      'db_define',
      { spec: { name: 'places', columns: [{ name: 'name' }, { name: 'area' }] } },
      titles,
    )
    expect(define.details).toEqual(['Columns: name, area'])
  })

  test('a reminder says when it speaks', () => {
    const reminder = describeTool(
      'reminder_create',
      { title: 'Bills due', table: 'bills', dateColumn: 'due', daysBefore: 2 },
      titles,
    )
    expect(`${reminder.action} ${reminder.subject}`).toBe('Set a reminder Bills due')
    expect(reminder.details).toEqual(['2 days before due · bills'])
  })

  test('what leaves the workspace says so', () => {
    const fetch = describeTool('fetch_url', { url: 'https://kyoto.travel/en' }, titles)
    expect(`${fetch.action} ${fetch.subject}`).toBe('Visit kyoto.travel')
    const search = describeTool('web_search', { query: 'loro 1.0 release' }, titles)
    expect(`${search.action} ${search.subject}`).toBe('Search the web for “loro 1.0 release”')
    expect(search.outbound).toBe(true)
    expect(fetch.outbound).toBe(true)
    expect(describeTool('sheet_create', {}, titles).outbound).toBe(false)
    const preview = describeTool('link_preview', { href: 'https://github.com/oven-sh/bun' }, titles)
    expect(`${preview.action} ${preview.subject}`).toBe('Read a bookmark from github.com')
    expect(preview.outbound).toBe(true)
    const photos = describeTool('unsplash_search', { query: 'fjord' }, titles)
    expect(`${photos.action} ${photos.subject}`).toBe('Search Unsplash for “fjord”')
    const picked = describeTool('unsplash_use', { id: 'Dwu85P9SOIk' }, titles)
    expect(`${picked.action} ${picked.subject}`).toBe('Picked a photo from Unsplash')
    expect(picked.outbound).toBe(true)
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
