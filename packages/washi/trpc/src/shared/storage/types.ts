import type { StorageConfig, StorageInfo } from '@washi/domain'

/** A workspace's own bucket. Absent in embedded mode: the machine's disk is the only store. */
export interface StorageStore {
  info(workspaceId: string): Promise<StorageInfo | null>
  set(workspaceId: string, actorId: string, config: StorageConfig): Promise<StorageInfo>
  /** New uploads go back to the server's store; nothing already uploaded moves. */
  remove(workspaceId: string): Promise<void>
}
