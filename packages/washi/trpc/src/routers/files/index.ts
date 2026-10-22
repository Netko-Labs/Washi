import { mergeRouters } from '../../init'
import { fileMutations } from './mutations'
import { fileQueries } from './queries'

export const filesRouter = mergeRouters(fileQueries, fileMutations)
