import { describe, expect, test } from 'bun:test'
import { open, seal } from '../lib/crypto'

const MASTER = 'm'.repeat(48)
const KEY = 'sk-ant-api03-not-a-real-key-7f3a'

describe('BYOK secrets are sealed per workspace', () => {
  test('a key round-trips', async () => {
    const sealed = await seal(MASTER, 'org_1', KEY)
    expect(await open(MASTER, 'org_1', sealed)).toBe(KEY)
  })

  test('only the last four characters are ever legible', async () => {
    const sealed = await seal(MASTER, 'org_1', KEY)
    expect(sealed.last4).toBe('7f3a')
    expect(sealed.ciphertext).not.toContain(KEY)
    expect(sealed.ciphertext).not.toContain('sk-ant')
  })

  test('the nonce differs every time, so the same key seals differently', async () => {
    const first = await seal(MASTER, 'org_1', KEY)
    const second = await seal(MASTER, 'org_1', KEY)
    expect(first.iv).not.toBe(second.iv)
    expect(first.ciphertext).not.toBe(second.ciphertext)
  })

  test("one workspace's ciphertext cannot be opened as another's", async () => {
    const sealed = await seal(MASTER, 'org_1', KEY)
    await expect(open(MASTER, 'org_2', sealed)).rejects.toThrow()
  })

  test('a different master key cannot open it', async () => {
    const sealed = await seal(MASTER, 'org_1', KEY)
    await expect(open('x'.repeat(48), 'org_1', sealed)).rejects.toThrow()
  })

  test('a weak master key is refused outright', async () => {
    await expect(seal('short', 'org_1', KEY)).rejects.toThrow(/32\+ characters/)
  })
})
