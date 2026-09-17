import { oplogTable } from '@washi/domain/db'
import { deviceId, getDb, hlcNow } from './client'

/** Every mutation appends here — the future sync unit (spec §4). */
export function appendOp(entity: string, entityId: string, op: unknown): void {
  getDb()
    .insert(oplogTable)
    .values({ opId: hlcNow(), deviceId: deviceId(), entity, entityId, op })
    .run()
}
