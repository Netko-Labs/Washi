import { isIP } from 'node:net'
import { PRIVATE_NAMES, PRIVATE_SUFFIXES, PRIVATE_V4, PRIVATE_V6 } from './constants'

/** An IPv4 address's four bytes, or null when it is not one. */
function v4Bytes(address: string): number[] | null {
  if (isIP(address) !== 4) return null
  return address.split('.').map(Number)
}

/** An IPv6 address's sixteen bytes — `::` expanded, a dotted IPv4 tail read — or null. */
function v6Bytes(address: string): number[] | null {
  const bare = address.replace(/%.*$/, '')
  if (isIP(bare) !== 6) return null
  let text = bare.toLowerCase()
  const tail = text.match(/(\d+\.\d+\.\d+\.\d+)$/)?.[1]
  if (tail) {
    const [a = 0, b = 0, c = 0, d = 0] = v4Bytes(tail) ?? []
    text = `${text.slice(0, -tail.length)}${((a << 8) | b).toString(16)}:${((c << 8) | d).toString(16)}`
  }
  const [head = '', rest] = text.split('::')
  const left = head ? head.split(':') : []
  const right = rest ? rest.split(':') : []
  const groups =
    rest === undefined
      ? left
      : [...left, ...Array(8 - left.length - right.length).fill('0'), ...right]
  if (groups.length !== 8) return null
  return groups.flatMap((group) => {
    const value = Number.parseInt(group || '0', 16)
    return [value >> 8, value & 0xff]
  })
}

const inV4 = (bytes: number[]) =>
  PRIVATE_V4.some(({ base, bits }) => {
    const want = v4Bytes(base) ?? []
    return matches(bytes, want, bits)
  })

/** Whether the first `bits` bits of two byte lists are the same. */
function matches(bytes: number[], base: number[], bits: number): boolean {
  for (let at = 0; at < bits; at += 8) {
    const keep = Math.min(8, bits - at)
    const mask = (0xff << (8 - keep)) & 0xff
    if (((bytes[at / 8] ?? 0) & mask) !== ((base[at / 8] ?? 0) & mask)) return false
  }
  return true
}

/** The IPv4 address an IPv6 one carries — mapped, compatible, NAT64 or 6to4 — or null. */
function embeddedV4(bytes: number[]): number[] | null {
  const zeros = (from: number, to: number) => bytes.slice(from, to).every((byte) => byte === 0)
  if (zeros(0, 10) && bytes[10] === 0xff && bytes[11] === 0xff) return bytes.slice(12)
  if (zeros(0, 12)) return bytes.slice(12)
  // 64:ff9b::/96, NAT64's well-known prefix: the last four bytes are the IPv4 address reached.
  if (matches(bytes, v6Bytes('64:ff9b::') ?? [], 96)) return bytes.slice(12)
  // 2002::/16, 6to4: the next four bytes are the IPv4 address.
  if (bytes[0] === 0x20 && bytes[1] === 0x02) return bytes.slice(2, 6)
  return null
}

/**
 * Whether a host — a name or an address in any spelling a URL or a resolver hands over — is
 * loopback, private, link-local, shared, multicast, reserved, or a name only an inside network
 * answers (`localhost`, `*.local`, `*.internal`, `metadata.google.internal`). An IPv6 address is read
 * as its sixteen bytes, so `::ffff:7f00:1`, `::ffff:127.0.0.1` and `64:ff9b::a9fe:a9fe` are the
 * IPv4 addresses they carry.
 */
export function isPrivateAddress(host: string): boolean {
  const bare = host
    .replace(/^\[|\]$/g, '')
    .replace(/\.$/, '')
    .toLowerCase()
  if (PRIVATE_NAMES.has(bare) || PRIVATE_SUFFIXES.some((suffix) => bare.endsWith(suffix))) {
    return true
  }
  const v4 = v4Bytes(bare)
  if (v4) return inV4(v4)
  const v6 = v6Bytes(bare)
  if (!v6) return false
  const carried = embeddedV4(v6)
  if (carried && inV4(carried)) return true
  return PRIVATE_V6.some(({ base, bits }) => matches(v6, v6Bytes(base) ?? [], bits))
}
