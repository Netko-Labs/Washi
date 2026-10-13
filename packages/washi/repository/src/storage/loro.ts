import { LoroDoc } from 'loro-crdt'

const TEXT_KEY = 'source'

/** New sheet → Loro doc snapshot holding its source text. */
export function createSnapshot(source: string): Uint8Array {
  const doc = new LoroDoc()
  doc.getText(TEXT_KEY).insert(0, source)
  return doc.export({ mode: 'snapshot' })
}

/** Whole-source replace as a minimal Loro text delta (spec Q2/Q4). */
export function updateSnapshot(snapshot: Uint8Array, nextSource: string): Uint8Array {
  const doc = new LoroDoc()
  doc.import(snapshot)
  doc.getText(TEXT_KEY).update(nextSource)
  return doc.export({ mode: 'snapshot' })
}

export function readSnapshot(snapshot: Uint8Array): string {
  const doc = new LoroDoc()
  doc.import(snapshot)
  return doc.getText(TEXT_KEY).toString()
}
