import { mergeRouters, router } from '../../init'
import { sheetMutations } from './mutations'
import { sheetQueries } from './queries'

export const sheetsRouter = mergeRouters(router({}), sheetQueries, sheetMutations)
