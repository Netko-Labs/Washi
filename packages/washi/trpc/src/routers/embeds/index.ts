import { mergeRouters } from '../../init'
import { embedMutations } from './mutations'
import { embedQueries } from './queries'

export const embedsRouter = mergeRouters(embedQueries, embedMutations)
