import type { TRPCClient } from '@trpc/client'
import type { AppRouter } from '@washi/trpc/client'

export type WashiClient = TRPCClient<AppRouter>

export interface UploadedFile {
  id: string
  name: string
  mime: string
  size: number
}

export interface HostOptions {
  client: WashiClient
  place: string
  /** Bytes into the workspace's files store. Absent on a host that cannot take uploads yet. */
  uploadFile?: (file: File) => Promise<UploadedFile>
  /** Where an upload's bytes are read back. Absent where nothing is stored yet. */
  fileUrl?: (id: string) => string
}
