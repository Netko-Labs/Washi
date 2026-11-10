import { inflateSync } from 'node:zlib'

const WOFF_HEADER = 44
const WOFF_ENTRY = 20
const SFNT_HEADER = 12
const SFNT_ENTRY = 16

const padded = (length: number) => (length + 3) & ~3

/**
 * A WOFF font unwrapped into the TrueType/OpenType file it carries: each table inflated, laid out
 * again behind an sfnt directory. Satori reads the house fonts as WOFF; resvg reads only sfnt, and
 * `@fontsource` ships no TTF — so the same bytes serve both, with no font added to the repo.
 */
export function sfntOf(woff: Uint8Array): Uint8Array {
  const view = new DataView(woff.buffer, woff.byteOffset, woff.byteLength)
  if (view.getUint32(0) !== 0x774f4646) throw new Error('not a WOFF font')
  const flavor = view.getUint32(4)
  const count = view.getUint16(12)
  const tables = Array.from({ length: count }, (_, index) => {
    const at = WOFF_HEADER + index * WOFF_ENTRY
    const offset = view.getUint32(at + 4)
    const stored = view.getUint32(at + 8)
    const length = view.getUint32(at + 12)
    const raw = woff.subarray(offset, offset + stored)
    return {
      tag: view.getUint32(at),
      checksum: view.getUint32(at + 16),
      data: stored < length ? new Uint8Array(inflateSync(raw)) : raw,
    }
  })
  const size = tables.reduce(
    (sum, table) => sum + padded(table.data.byteLength),
    SFNT_HEADER + count * SFNT_ENTRY,
  )
  const out = new Uint8Array(size)
  const head = new DataView(out.buffer)
  let power = 1
  let log = 0
  while (power * 2 <= count) {
    power *= 2
    log++
  }
  head.setUint32(0, flavor)
  head.setUint16(4, count)
  head.setUint16(6, power * SFNT_ENTRY)
  head.setUint16(8, log)
  head.setUint16(10, count * SFNT_ENTRY - power * SFNT_ENTRY)
  let offset = SFNT_HEADER + count * SFNT_ENTRY
  tables.forEach((table, index) => {
    const at = SFNT_HEADER + index * SFNT_ENTRY
    head.setUint32(at, table.tag)
    head.setUint32(at + 4, table.checksum)
    head.setUint32(at + 8, offset)
    head.setUint32(at + 12, table.data.byteLength)
    out.set(table.data, offset)
    offset += padded(table.data.byteLength)
  })
  return out
}
