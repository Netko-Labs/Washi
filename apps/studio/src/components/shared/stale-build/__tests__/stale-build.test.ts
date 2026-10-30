import { afterEach, beforeEach, describe, expect, test } from 'bun:test'
import { isStaleChunkError, reloadForNewBuild } from '../utils'

const stored = new Map<string, string>()
let reloads = 0

beforeEach(() => {
  stored.clear()
  reloads = 0
  Object.assign(globalThis, {
    sessionStorage: {
      getItem: (key: string) => stored.get(key) ?? null,
      setItem: (key: string, value: string) => stored.set(key, value),
    },
    window: { location: { reload: () => reloads++ } },
  })
})

afterEach(() => {
  Reflect.deleteProperty(globalThis, 'sessionStorage')
  Reflect.deleteProperty(globalThis, 'window')
})

describe('a build replaced under the tab', () => {
  test('knows a gone chunk in each browser’s words, and nothing else', () => {
    for (const message of [
      'Failed to fetch dynamically imported module: https://washi.netko.dev/assets/chat-Bx1.js',
      'error loading dynamically imported module: /assets/page-Q2.js',
      'Importing a module script failed.',
      'Unable to preload CSS for /assets/styles-9a.css',
    ]) {
      expect(isStaleChunkError(new TypeError(message))).toBe(true)
    }
    expect(isStaleChunkError(new Error('Cannot read properties of undefined'))).toBe(false)
    expect(isStaleChunkError(null)).toBe(false)
  })

  test('reloads once, not again inside the window, and again after it', () => {
    expect(reloadForNewBuild(1_000)).toBe(true)
    expect(reloadForNewBuild(20_000)).toBe(false)
    expect(reloads).toBe(1)
    expect(reloadForNewBuild(40_000)).toBe(true)
    expect(reloads).toBe(2)
  })

  test('never reloads when it cannot stamp the reload', () => {
    Object.assign(globalThis, {
      sessionStorage: {
        getItem: () => {
          throw new Error('SecurityError')
        },
      },
    })
    expect(reloadForNewBuild(1_000)).toBe(false)
    expect(reloads).toBe(0)
  })
})
