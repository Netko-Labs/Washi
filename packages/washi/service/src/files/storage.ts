import type { StorageConfig } from '@washi/domain'
import { ProbeMismatchError, probeBlobStore, s3BlobStores } from '@washi/repository'
import { isPrivateAddress } from '@washi/tsuru'
import type { StorageTest } from './types'
import { STORAGE_REFUSALS } from './values'

const PROBE_TIMEOUT_MS = 15_000

/**
 * Writes, reads back and deletes one small file where this workspace's uploads would go. A
 * private, loopback or link-local address is the server's own network: only its app admin may
 * point a workspace there (a MinIO beside it), or any owner could make the server knock inside.
 */
export async function testStorage(
  config: StorageConfig,
  workspaceId: string,
  { allowPrivate = false, timeoutMs = PROBE_TIMEOUT_MS } = {},
): Promise<StorageTest> {
  if (!allowPrivate && isPrivateAddress(new URL(config.endpoint).hostname)) {
    return {
      ok: false,
      reason: 'That address is inside the server’s own network. Only the app admin can use one.',
    }
  }
  const store = s3BlobStores(config)(workspaceId)
  let timer: ReturnType<typeof setTimeout> | undefined
  const silence = new Promise<StorageTest>((resolve) => {
    timer = setTimeout(
      () =>
        resolve({
          ok: false,
          reason: `No answer from this address in ${timeoutMs / 1000} seconds.`,
        }),
      timeoutMs,
    )
  })
  const probe = probeBlobStore(store).then(
    (): StorageTest => ({ ok: true }),
    (cause: unknown): StorageTest => ({ ok: false, reason: refusalOf(cause) }),
  )
  try {
    return await Promise.race([probe, silence])
  } finally {
    clearTimeout(timer)
  }
}

function refusalOf(cause: unknown): string {
  if (cause instanceof ProbeMismatchError) return cause.message
  const code = (cause as { code?: unknown } | null)?.code
  const known = typeof code === 'string' ? STORAGE_REFUSALS[code] : undefined
  if (known) return known
  const message = cause instanceof Error ? cause.message : String(cause)
  return `The bucket refused the test file${typeof code === 'string' ? ` (${code})` : ''}: ${message}`
}
