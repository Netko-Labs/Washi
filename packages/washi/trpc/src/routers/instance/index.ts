import { mergeRouters, router } from '../../init'
import { instanceMutations } from './mutations'
import { instanceQueries } from './queries'

export const instanceRouter = mergeRouters(router({}), instanceQueries, instanceMutations)
