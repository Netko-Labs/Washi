import { describe, expect, test } from 'bun:test'
import { sameOriginPath } from '../return-path'

describe('a return address stays on this site', () => {
  test('a path here comes back whole', () => {
    expect(sameOriginPath('/')).toBe('/')
    expect(sameOriginPath('/w/abc/p/def?peek=x#top')).toBe('/w/abc/p/def?peek=x#top')
    expect(sameOriginPath('/workspaces?invite=inv_1')).toBe('/workspaces?invite=inv_1')
    expect(sameOriginPath('/%5Cx')).toBe('/%5Cx')
  })

  test('an address a browser reads as another site goes nowhere', () => {
    for (const target of [
      '//x',
      '/\\x',
      '\\\\x',
      '\\/x',
      'https://x',
      'http://x/w',
      'javascript:alert(1)',
      'JavaScript:alert(1)',
      'data:text/html,hi',
      '/\t/x',
      '/\n/x',
      '/\r\n/x',
      '\t//x',
      ' //x',
      'https:\\\\x',
    ]) {
      expect(sameOriginPath(target)).toBeNull()
    }
  })

  test('nothing, or no text, goes nowhere', () => {
    expect(sameOriginPath(undefined)).toBeNull()
    expect(sameOriginPath('')).toBeNull()
    expect(sameOriginPath(['/w'])).toBeNull()
  })

  test('an origin given is the one held to', () => {
    expect(sameOriginPath('https://washi.example/w/a', 'https://washi.example')).toBe('/w/a')
    expect(sameOriginPath('https://evil.example/w/a', 'https://washi.example')).toBeNull()
  })
})
