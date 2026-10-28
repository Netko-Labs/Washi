import type { RecordData } from '@washi/ink'
import type { Workspace } from './client'

export interface RecordWrite {
  kind: 'insert' | 'update'
  tableId: string
  recordId: string
  /** The row as it is now; `before` is what an update replaced. */
  data: RecordData
  before: RecordData | null
  author: string | null
}

type Listener = (write: RecordWrite) => void

// Callbacks, not data: who wants to hear about a workspace's row writes, kept per open workspace.
const listeners = new WeakMap<Workspace, Set<Listener>>()

/** Hears every row a write lands — whatever path wrote it; returns the unsubscribe. */
export function onRecordWrite(ws: Workspace, listener: Listener): () => void {
  const set = listeners.get(ws) ?? new Set<Listener>()
  listeners.set(ws, set)
  set.add(listener)
  return () => set.delete(listener)
}

export function tellRecordWrite(ws: Workspace, write: RecordWrite): void {
  for (const listener of listeners.get(ws) ?? []) listener(write)
}
