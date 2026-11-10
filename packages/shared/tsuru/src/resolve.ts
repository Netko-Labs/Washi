import { lookup } from 'node:dns/promises'
import { isIP } from 'node:net'
import { checkServerIdentity } from 'node:tls'
import { isPrivateAddress } from './address'
import { TsuruError } from './errors'
import type { AddressLookup, ResolvedAddress } from './types'

const dnsLookup: AddressLookup = (host) => lookup(host, { all: true, verbatim: true })

/** A test's own resolver; while set, nothing is pinned (the test's fetch sees the name). */
let testLookup: AddressLookup | null = null

/** Tests answer names without the network: every fetch through tsuru resolves with this. */
export function setAddressLookup(next: AddressLookup | null): void {
  testLookup = next
}

/**
 * Every address a name answers, refused if any is private — so a public name that also answers
 * 127.0.0.1 never reaches it. An address literal was judged by `checkUrl` already.
 */
export async function publicAddresses(host: string): Promise<ResolvedAddress[]> {
  const bare = host.replace(/^\[|\]$/g, '')
  if (isIP(bare)) return [{ address: bare, family: isIP(bare) }]
  let found: ResolvedAddress[]
  try {
    found = await (testLookup ?? dnsLookup)(bare)
  } catch {
    throw new TsuruError(`"${bare}" does not resolve`)
  }
  if (found.length === 0) throw new TsuruError(`"${bare}" does not resolve`)
  const inside = found.find((each) => isPrivateAddress(each.address))
  if (inside) {
    throw new TsuruError(`"${bare}" resolves to a private address (${inside.address})`)
  }
  return found
}

/**
 * The request as it goes out: to the address just checked, so DNS cannot answer differently
 * between the check and the connection (rebinding), while the TLS name (SNI), the certificate
 * check and the Host header stay the URL's own name. A literal, or a test's resolver, goes as is.
 */
export function pinned(url: URL, addresses: ResolvedAddress[]): { url: URL; init: RequestInit } {
  // An IPv4 address first: a server without IPv6 routes would fail on an AAAA answer.
  const first = addresses.find((each) => each.family === 4) ?? addresses[0]
  const name = url.hostname
  if (!first || isIP(name.replace(/^\[|\]$/g, '')) || testLookup) return { url, init: {} }
  const target = new URL(url)
  target.hostname = first.family === 6 ? `[${first.address}]` : first.address
  const init = {
    headers: { host: url.host },
    tls: {
      serverName: name,
      checkServerIdentity: (_address: string, cert: Parameters<typeof checkServerIdentity>[1]) =>
        checkServerIdentity(name, cert),
    },
  }
  return { url: target, init: init as RequestInit }
}
