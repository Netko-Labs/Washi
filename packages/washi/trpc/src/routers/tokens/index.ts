import { mergeRouters } from '../../init'
import { tokenMutations } from './mutations'
import { tokenQueries } from './queries'

export const tokensRouter = mergeRouters(tokenQueries, tokenMutations)
