import type { BlobStore } from './types'

const PROBE = new TextEncoder().encode('washi checks it can write here')

/** Put, read back and delete one small object; throws whatever the store refused with. */
export async function probeBlobStore(store: BlobStore): Promise<void> {
  const key = `.washi-probe-${Bun.randomUUIDv7()}`
  await store.write(key, PROBE, 'text/plain')
  let back: Uint8Array | null
  try {
    back = await store.read(key)
  } finally {
    // A failed read must not leave the test file behind; a failed delete is the refusal to report.
    await store.delete(key)
  }
  if (!back || Buffer.compare(back, PROBE) !== 0) throw new ProbeMismatchError()
}

export class ProbeMismatchError extends Error {
  constructor() {
    super('The bucket took the test file but handed back something else.')
  }
}
