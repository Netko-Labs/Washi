import type { PaperHost } from '../provider'
import type { FileAs } from './types'

const AS: readonly FileAs[] = ['text', 'json', 'bytes']

export const fileAsOf = (as: unknown): FileAs =>
  AS.includes(as as FileAs) ? (as as FileAs) : 'text'

/** An upload as `useFile` hands it over: decoded text, its JSON read, or the bytes themselves. */
export async function readFileAs(host: PaperHost, key: string, as: FileAs): Promise<unknown> {
  if (!host.readFile) throw new Error('this page reads no uploads here')
  const bytes = await host.readFile(key)
  if (as === 'bytes') return bytes
  const text = new TextDecoder().decode(bytes)
  if (as === 'text') return text
  try {
    return JSON.parse(text)
  } catch {
    throw new Error(`${key} is not JSON`)
  }
}

/** Bytes as base64, for a sandbox that only takes text across. */
export function base64Of(bytes: Uint8Array): string {
  let binary = ''
  for (let at = 0; at < bytes.length; at += 8192) {
    binary += String.fromCharCode(...bytes.subarray(at, at + 8192))
  }
  return btoa(binary)
}

/** A Terminal's files read before it runs, each under the path its program opens. */
export async function readTerminalFiles(
  host: PaperHost,
  files: Record<string, string> | undefined,
): Promise<Record<string, Uint8Array>> {
  const entries = Object.entries(files ?? {})
  if (entries.length > 0 && !host.readFile) throw new Error('this app reads no uploads')
  const read = await Promise.all(
    entries.map(async ([path, key]) => {
      try {
        return [path, await (host.readFile?.(key) ?? new Uint8Array())] as const
      } catch (cause) {
        throw new Error(`${path}: ${cause instanceof Error ? cause.message : String(cause)}`)
      }
    }),
  )
  return Object.fromEntries(read)
}
