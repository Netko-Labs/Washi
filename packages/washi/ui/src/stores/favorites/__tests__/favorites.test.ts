import { beforeEach, describe, expect, test } from 'bun:test'
import { useFavoritesStore } from '../favorites-store'

const memory = new Map<string, string>()
beforeEach(() => {
  memory.clear()
  Object.assign(globalThis, {
    localStorage: {
      getItem: (key: string) => memory.get(key) ?? null,
      setItem: (key: string, value: string) => memory.set(key, value),
    },
  })
})

describe('favorites are per person, per workspace', () => {
  test('a toggle sticks across a reload of the same workspace', () => {
    useFavoritesStore.getState().bind('org_a')
    useFavoritesStore.getState().toggle('page-1')
    useFavoritesStore.getState().bind('org_a')
    expect(useFavoritesStore.getState().ids).toEqual(['page-1'])
  })

  test('another workspace starts empty, and toggling twice removes', () => {
    useFavoritesStore.getState().bind('org_a')
    useFavoritesStore.getState().toggle('page-1')
    useFavoritesStore.getState().bind('org_b')
    expect(useFavoritesStore.getState().ids).toEqual([])
    useFavoritesStore.getState().bind('org_a')
    useFavoritesStore.getState().toggle('page-1')
    expect(useFavoritesStore.getState().ids).toEqual([])
  })
})
