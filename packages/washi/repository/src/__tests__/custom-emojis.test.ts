import { describe, expect, test } from 'bun:test'
import {
  createCustomEmoji,
  createSheet,
  customEmojiNamed,
  deleteCustomEmoji,
  deleteSheet,
  isUploadWorn,
  listCustomEmojis,
  openWorkspace,
  trashedUploads,
} from '..'

describe('custom emojis', () => {
  test('names are unique per workspace; list is by name; remove deletes one row', () => {
    const ws = openWorkspace({ id: 'w', path: ':memory:' })
    const fox = createCustomEmoji(ws, { name: 'fox', fileId: 'f1' }, 'ana')
    createCustomEmoji(ws, { name: 'badger', fileId: 'f2' }, 'ben')
    expect(() => createCustomEmoji(ws, { name: 'fox', fileId: 'f3' }, 'ben')).toThrow()
    expect(listCustomEmojis(ws).map((emoji) => emoji.name)).toEqual(['badger', 'fox'])
    expect(customEmojiNamed(ws, 'fox')?.id).toBe(fox.id)

    expect(deleteCustomEmoji(ws, fox.id)).toBe(true)
    expect(deleteCustomEmoji(ws, fox.id)).toBe(false)
    expect(listCustomEmojis(ws).map((emoji) => emoji.name)).toEqual(['badger'])
    expect(customEmojiNamed(ws, 'fox')).toBeNull()
    ws.close()
  })

  test('another workspace may use the same name', () => {
    const one = openWorkspace({ id: 'a', path: ':memory:' })
    const two = openWorkspace({ id: 'b', path: ':memory:' })
    createCustomEmoji(one, { name: 'fox', fileId: 'f1' }, 'ana')
    expect(createCustomEmoji(two, { name: 'fox', fileId: 'f1' }, 'ana').name).toBe('fox')
    one.close()
    two.close()
  })

  test('a purge never frees an upload an emoji holds', () => {
    const ws = openWorkspace({ id: 'w', path: ':memory:' })
    const page = createSheet(
      ws,
      { title: 'p', source: '...', icon: 'file:fox' },
      { body: '', refs: [] },
    )
    createCustomEmoji(ws, { name: 'fox', fileId: 'fox' }, 'ana')
    deleteSheet(ws, page.id)
    expect(trashedUploads(ws, page.id)).toEqual([])
    expect(trashedUploads(ws)).toEqual([])
    expect(isUploadWorn(ws, 'fox')).toBe(true)
    ws.close()
  })

  test('an upload is worn while a page or an emoji points at it', () => {
    const ws = openWorkspace({ id: 'w', path: ':memory:' })
    createSheet(ws, { title: 'p', source: '...', cover: 'file:cover' }, { body: '', refs: [] })
    expect(isUploadWorn(ws, 'cover')).toBe(true)
    expect(isUploadWorn(ws, 'nobody')).toBe(false)
    const emoji = createCustomEmoji(ws, { name: 'kit', fileId: 'kit' }, 'ana')
    expect(isUploadWorn(ws, 'kit')).toBe(true)
    deleteCustomEmoji(ws, emoji.id)
    expect(isUploadWorn(ws, 'kit')).toBe(false)
    ws.close()
  })
})
