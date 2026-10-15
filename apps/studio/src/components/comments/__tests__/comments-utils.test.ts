import { describe, expect, test } from 'bun:test'
import type { Comment } from '@washi/domain'
import { bodySegments, keptMentions, mentionMatches, mentionQuery, threadsOf } from '../lib/utils'

const comment = (id: string, threadId: string): Comment => ({
  id,
  sheetId: 's',
  threadId,
  authorId: 'a',
  authorName: 'Ana',
  body: id,
  mentions: [],
  resolved: false,
  hlcCreated: id,
})

describe('comments', () => {
  test('replies gather under their thread', () => {
    const threads = threadsOf([comment('1', '1'), comment('2', '2'), comment('3', '1')])
    expect(
      threads.map((thread) => [thread.root.id, thread.replies.map((reply) => reply.id)]),
    ).toEqual([
      ['1', ['3']],
      ['2', []],
    ])
  })

  test('mentions are picked out of the body, the longest name first', () => {
    const segments = bodySegments('ping @Ana Pérez and @Ana', [
      { id: '1', name: 'Ana' },
      { id: '2', name: 'Ana Pérez' },
    ])
    expect(segments.filter((segment) => segment.isMention).map((segment) => segment.text)).toEqual([
      '@Ana Pérez',
      '@Ana',
    ])
  })

  test('the @query is read from just before the caret', () => {
    expect(mentionQuery('hi @ke', 6)).toBe('ke')
    expect(mentionQuery('mail a@b', 8)).toBeNull()
    expect(mentionQuery('done @kenji ', 12)).toBeNull()
  })

  test('an @query matches names anywhere in them, case-blind', () => {
    const people = [
      { id: 'a', name: 'Kenji Mori' },
      { id: 'b', name: 'Ana Ruiz' },
    ]
    expect(mentionMatches(people, 'MOR').map((each) => each.id)).toEqual(['a'])
    expect(mentionMatches(people, '')).toHaveLength(2)
  })

  test('a mention erased from the draft is not sent', () => {
    expect(
      keptMentions('thanks @Ana', [
        { id: '1', name: 'Ana' },
        { id: '2', name: 'Kenji' },
      ]),
    ).toEqual([{ id: '1', name: 'Ana' }])
  })
})
