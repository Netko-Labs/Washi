export interface FetchedFile {
  bytes: Uint8Array
  /** The type the host said, bare (`image/png`), or null when it said none. */
  contentType: string | null
  /** Where the bytes came from. */
  url: string
  /** The last part of that address's path, when it names a file. */
  filename: string | null
}

export interface FileFetchOptions {
  /** The server's admin lifted the private-range guard (D118). */
  allowPrivate?: boolean
  /** The largest file taken; a larger declared length is refused before the body is read. */
  maxBytes: number
  timeoutMs?: number
  /** Stands in for `fetch` in tests. */
  fetcher?: typeof fetch
}

/** One address a name answers, as `dns.lookup({ all: true })` says it. */
export interface ResolvedAddress {
  address: string
  family: number
}

/** Every address a name answers. */
export type AddressLookup = (host: string) => Promise<ResolvedAddress[]>
