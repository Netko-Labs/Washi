import { describe, expect, test } from 'bun:test'
import { getUnsplashPhoto, keepUnsplashPhoto, listUnsplashPhotos, openWorkspace } from '..'

const fjord = {
  id: 'Dwu85P9SOIk',
  regularUrl: 'https://images.unsplash.com/photo-1?w=1080',
  fullUrl: 'https://images.unsplash.com/photo-1?q=85',
  photographer: 'Ansel Adams',
  profileUrl: 'https://unsplash.com/@ansel',
  pageUrl: 'https://unsplash.com/photos/Dwu85P9SOIk',
}

describe('unsplash photos', () => {
  test('a picked photo is kept whole and read back by id', () => {
    const ws = openWorkspace({ id: 'w', path: ':memory:' })
    keepUnsplashPhoto(ws, fjord, 'ana')
    expect(getUnsplashPhoto(ws, fjord.id)).toMatchObject({ ...fjord, pickedBy: 'ana' })
    expect(getUnsplashPhoto(ws, 'nope')).toBeNull()
    ws.close()
  })

  test('picked again, a photo is one row holding what Unsplash says now', () => {
    const ws = openWorkspace({ id: 'w', path: ':memory:' })
    keepUnsplashPhoto(ws, fjord, 'ana')
    keepUnsplashPhoto(ws, { ...fjord, photographer: 'A. Adams' }, null)
    expect(listUnsplashPhotos(ws)).toHaveLength(1)
    expect(getUnsplashPhoto(ws, fjord.id)).toMatchObject({
      photographer: 'A. Adams',
      pickedBy: null,
    })
    ws.close()
  })
})
