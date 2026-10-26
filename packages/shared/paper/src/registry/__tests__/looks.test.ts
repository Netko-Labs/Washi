import { describe, expect, test } from 'bun:test'
import { hasErrors, parse, validate } from '@washi/wsx'
import { paperRegistry } from '../index'

const passes = (props: string) =>
  !hasErrors(validate(parse(`<Sheet title="p" ${props}><Text>x</Text></Sheet>`), paperRegistry))

describe('a page wears its own look (D64)', () => {
  test('an icon is a registry name, one emoji or an upload', () => {
    expect(passes('icon="book"')).toBe(true)
    expect(passes('icon="🦊"')).toBe(true)
    expect(passes('icon="file:01a1767e-7ed7"')).toBe(true)
    expect(passes('icon="nope"')).toBe(false)
    expect(passes('icon="🦊🦊🦊🦊🦊🦊🦊🦊🦊"')).toBe(false)
  })

  test('a cover is a key Washi knows, never a URL', () => {
    expect(passes('cover="preset:sage"')).toBe(true)
    expect(passes('cover="picture:canyon"')).toBe(true)
    expect(passes('cover="file:01a1767e-7ed7"')).toBe(true)
    expect(passes('cover="preset:neon"')).toBe(false)
    expect(passes('cover="picture:beach"')).toBe(false)
    expect(passes('cover="https://example.com/a.jpg"')).toBe(false)
  })
})
