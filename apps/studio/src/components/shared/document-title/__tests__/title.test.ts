import { describe, expect, test } from 'bun:test'
import { titleOf } from '../utils'

describe('titleOf', () => {
  test('joins place and context', () => {
    expect(titleOf(['Roadmap', 'Netko'])).toBe('Roadmap · Netko')
  })

  test('an empty title reads Untitled', () => {
    expect(titleOf(['', 'Netko'])).toBe('Untitled · Netko')
    expect(titleOf(['   ', 'Netko'])).toBe('Untitled · Netko')
  })

  test('a part still loading is left out, never guessed', () => {
    expect(titleOf([null, 'Netko'])).toBe('Netko')
    expect(titleOf([undefined, 'Routines'])).toBe('Routines')
    expect(titleOf([null, undefined])).toBe('')
  })

  test('trims what it keeps', () => {
    expect(titleOf([' Inbox ', 'Netko'])).toBe('Inbox · Netko')
  })
})
