import { fileTable } from '@washi/domain/db'
import { eq } from 'drizzle-orm'
import type { Workspace } from '../storage/client'
import type { BlobStore, FileStore, StoredFile } from './types'

/** The row is the workspace's; the bytes are the blob store's, keyed by the row's id. */
export function createFileStore(ws: Workspace, blobs: BlobStore): FileStore {
  const rowOf = (id: string): StoredFile | null => {
    const [row] = ws.db.select().from(fileTable).where(eq(fileTable.id, id)).all()
    return row
      ? { id: row.id, name: row.name, mime: row.mime, size: row.size, hlcCreated: row.hlcCreated }
      : null
  }

  return {
    async put({ name, mime, bytes }) {
      const file: StoredFile = {
        id: Bun.randomUUIDv7(),
        name,
        mime,
        size: bytes.byteLength,
        hlcCreated: ws.now(),
      }
      await blobs.write(file.id, bytes, mime)
      ws.db.insert(fileTable).values(file).run()
      return file
    },
    async get(id) {
      const file = rowOf(id)
      if (!file) return null
      const bytes = await blobs.read(id)
      return bytes ? { file, bytes } : null
    },
    info: rowOf,
    async remove(id) {
      await blobs.delete(id)
      ws.db.delete(fileTable).where(eq(fileTable.id, id)).run()
    },
  }
}
