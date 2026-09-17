import { oplogTable } from '@washi/domain/db'
import type { Workspace } from './client'

/** Every mutation appends here — the future sync unit (spec §4). */
export function appendOp(ws: Workspace, entity: string, entityId: string, op: unknown): void {
  ws.db
    .insert(oplogTable)
    .values({ opId: ws.now(), deviceId: ws.deviceId, entity, entityId, op })
    .run()
}
