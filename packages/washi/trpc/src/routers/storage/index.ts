import { mergeRouters } from '../../init'
import { storageMutations } from './mutations'
import { storageQueries } from './queries'

export const storageRouter = mergeRouters(storageQueries, storageMutations)
