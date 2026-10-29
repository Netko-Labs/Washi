import { mergeRouters } from '../../init'
import { oauthMutations } from './mutations'
import { oauthQueries } from './queries'

export const oauthRouter = mergeRouters(oauthQueries, oauthMutations)
