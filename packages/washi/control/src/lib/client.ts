import { SQL } from 'bun'
import { drizzle } from 'drizzle-orm/bun-sql'
import * as schema from '../db/schema'

export type ControlDB = ReturnType<typeof createControlDb>['db']

/** Bun 1.4 speaks Postgres natively, so there is no `pg` driver in the tree. */
export function createControlDb(databaseUrl: string) {
  const sql = new SQL(databaseUrl)
  return {
    db: drizzle({ client: sql, schema }),
    async close() {
      await sql.close()
    },
  }
}
