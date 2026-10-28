import { mergeRouters } from '../../init'
import { linkMutations } from './mutations'

export const linksRouter = mergeRouters(linkMutations)
