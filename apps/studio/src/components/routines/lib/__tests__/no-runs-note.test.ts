import { describe, expect, test } from 'bun:test'
import { noRunsNote, wallLabel } from '../utils'

const NOW = new Date('2026-10-30T08:00:00Z')
const daily = { cron: '0 9 * * *', timeZone: 'UTC' }

describe('a routine with no runs yet', () => {
  test('a paused one says so, and when it runs once resumed', () => {
    const note = noRunsNote({ ...daily, enabled: false }, NOW)
    expect(note).toContain('paused')
    expect(note).toContain(wallLabel('2026-10-30T09:00'))
    expect(note).not.toContain('minute')
  })

  test('a running one names its next run', () => {
    const note = noRunsNote({ ...daily, enabled: true }, NOW)
    expect(note).toContain(wallLabel('2026-10-30T09:00'))
    expect(note).not.toContain('paused')
  })

  test('a schedule that never comes, or one not loaded yet, offers Run now alone', () => {
    expect(noRunsNote({ cron: 'not cron', timeZone: 'UTC', enabled: true }, NOW)).toBe(
      'No runs yet. Run it now.',
    )
    expect(noRunsNote(null, NOW)).toBe('No runs yet. Run it now.')
  })
})
