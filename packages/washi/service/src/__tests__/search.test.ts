import { describe, expect, test } from 'bun:test'
import { webSearch } from '../agents/search'

describe('web search', () => {
  test('without a key it says where one goes instead of calling anyone', async () => {
    await expect(webSearch(undefined, 'loro')).rejects.toThrow('Settings')
    await expect(webSearch(async () => null, 'loro')).rejects.toThrow('EXA_API_KEY')
  })
})
