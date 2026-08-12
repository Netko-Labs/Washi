import type { UserTable } from '@washi/desktop-domain'
import { listTables } from '@washi/desktop-repository'
import { defineUserTable, runMutation, runQuery, toggleTaskRecord } from '@washi/desktop-service'
import {
  type InkMutation,
  type InkQuery,
  mutationSchema,
  type QueryResult,
  querySchema,
} from '@washi/ink'
import { rpc } from 'mirinjs/rpc'

export function tableRoutes() {
  return {
    listTables: rpc.query((): UserTable[] => listTables()),
    defineTable: rpc.mutation(({ spec }: { spec: unknown }): UserTable => defineUserTable(spec)),
    queryRecords: rpc.query(
      ({ query }: { query: InkQuery }): QueryResult => runQuery(querySchema.parse(query)),
    ),
    mutateRecords: rpc.mutation(
      ({ mutation }: { mutation: InkMutation }): { affected: number; id?: string } =>
        runMutation(mutationSchema.parse(mutation)),
    ),
    toggleTask: rpc.mutation(({ recordId, done }: { recordId: string; done: boolean }): void => {
      toggleTaskRecord(recordId, done)
    }),
  }
}
