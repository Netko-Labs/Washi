import { mergeRouters, router } from '../../init'
import { commentMutations } from './mutations'
import { commentQueries } from './queries'

export const commentsRouter = mergeRouters(router({}), commentQueries, commentMutations)
