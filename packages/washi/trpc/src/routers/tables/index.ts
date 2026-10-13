import { mergeRouters, router } from '../../init'
import { tableMutations } from './mutations'
import { tableQueries } from './queries'

export const tablesRouter = mergeRouters(router({}), tableQueries, tableMutations)
