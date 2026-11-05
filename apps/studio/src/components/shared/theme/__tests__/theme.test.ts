import { describe, expect, test } from 'bun:test'
import { THEME_SCRIPT } from '../constants'
import { isDarkFor, isTheme } from '../utils'

function paintsDark(stored: string | null, prefersDark: boolean, pathname = '/w/x'): boolean {
  const classes = new Set<string>()
  const run = new Function('localStorage', 'matchMedia', 'document', 'location', THEME_SCRIPT)
  run(
    { getItem: () => stored },
    () => ({ matches: prefersDark }),
    { documentElement: { classList: { add: (name: string) => classes.add(name) } } },
    { pathname },
  )
  return classes.has('dark')
}

describe('theme', () => {
  test('system follows the device; nothing stored stays light', () => {
    expect(isDarkFor('system', true)).toBe(true)
    expect(isDarkFor('system', false)).toBe(false)
    expect(isDarkFor('dark', false)).toBe(true)
    expect(isDarkFor('light', true)).toBe(false)
    expect(isTheme('system')).toBe(true)
    expect(isTheme('sepia')).toBe(false)
  })

  test('the pre-paint script reads every choice the store writes', () => {
    expect(paintsDark('dark', false)).toBe(true)
    expect(paintsDark('system', true)).toBe(true)
    expect(paintsDark('system', false)).toBe(false)
    expect(paintsDark('light', true)).toBe(false)
    expect(paintsDark(null, true)).toBe(false)
  })

  test('a shared link follows the device until its visitor chooses', () => {
    expect(paintsDark(null, true, '/s/ws/token')).toBe(true)
    expect(paintsDark(null, false, '/s/ws/token')).toBe(false)
    expect(paintsDark('light', true, '/s/ws/token')).toBe(false)
    expect(paintsDark('dark', false, '/s/ws/token')).toBe(true)
  })
})
