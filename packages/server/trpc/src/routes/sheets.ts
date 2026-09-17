import type { SearchHit, SheetDetail, SheetSummary, SheetWrite } from '@washi/domain'
import { sheetWriteSchema } from '@washi/domain'
import { getBacklinks, getSheet, listSheets, searchSheets } from '@washi/repository'
import {
  checkSource,
  createSheetFromSource,
  removeSheet,
  updateSheetFromSource,
  type WsxCheck,
} from '@washi/service'
import { rpc } from 'mirinjs/rpc'

export function sheetRoutes() {
  return {
    listSheets: rpc.query((): SheetSummary[] => listSheets()),
    getSheet: rpc.query(({ id }: { id: string }): SheetDetail | null => getSheet(id)),
    getBacklinks: rpc.query(({ id }: { id: string }): SheetSummary[] => getBacklinks(id)),
    searchSheets: rpc.query(({ term }: { term: string }): SearchHit[] => searchSheets(term)),
    checkWsx: rpc.query(({ source }: { source: string }): WsxCheck => checkSource(source)),
    createSheet: rpc.mutation(
      ({ write }: { write: SheetWrite }): SheetDetail =>
        createSheetFromSource(sheetWriteSchema.parse(write)),
    ),
    updateSheet: rpc.mutation(
      ({ id, write }: { id: string; write: SheetWrite }): SheetDetail =>
        updateSheetFromSource(id, sheetWriteSchema.parse(write)),
    ),
    deleteSheet: rpc.mutation(({ id }: { id: string }): void => {
      removeSheet(id)
    }),
  }
}
