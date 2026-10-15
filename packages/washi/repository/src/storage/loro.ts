import { decodeFrontiers, encodeFrontiers, LoroDoc } from 'loro-crdt'

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

/** Where a page's history stands, as a string a client can hand back with its next edit. */
export function versionOf(snapshot: Uint8Array): string {
  const doc = new LoroDoc()
  doc.import(snapshot)
  return Buffer.from(encodeFrontiers(doc.oplogFrontiers())).toString('base64')
}

/**
 * The client wrote `next` against `version`; whatever landed since stays. Loro forks the doc at
 * that version, replays the client's edit there, and merges it back into the present.
 */
export function mergeText(snapshot: Uint8Array, version: string, next: string): string {
  const doc = new LoroDoc()
  doc.import(snapshot)
  const base = decodeFrontiers(Buffer.from(version, 'base64'))
  const fork = doc.forkAt(base)
  fork.getText(TEXT_KEY).update(next)
  fork.commit()
  doc.import(fork.export({ mode: 'update', from: doc.frontiersToVV(base) }))
  return doc.getText(TEXT_KEY).toString()
}
