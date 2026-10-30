import { describe, expect, test } from 'bun:test'
import { hasErrors, parse, validate } from '@washi/wsx'
import { paperRegistry, unsplashCaption, unsplashLink } from '../index'

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

  test('an Unsplash cover is its photo id, never its address (D117)', () => {
    expect(passes('cover="unsplash:Dwu85P9SOIk"')).toBe(true)
    expect(passes('cover="unsplash:"')).toBe(false)
    expect(passes('cover="unsplash:../photos/x"')).toBe(false)
    expect(passes('cover="unsplash:https://images.unsplash.com/x"')).toBe(false)
  })

  test('an Unsplash credit names the photographer and links back with the referral', () => {
    expect(unsplashCaption('Ansel Adams')).toBe('Photo by Ansel Adams on Unsplash')
    const link = new URL(unsplashLink('https://unsplash.com/@ansel?utm_source=other'))
    expect(link.origin + link.pathname).toBe('https://unsplash.com/@ansel')
    expect(link.searchParams.get('utm_source')).toBe('washi')
    expect(link.searchParams.get('utm_medium')).toBe('referral')
  })
})
