import { mergeRouters, router } from '../../init'
import { liveMutations } from './mutations'
import { liveSubscriptions } from './subscriptions'

export const liveRouter = mergeRouters(router({}), liveMutations, liveSubscriptions)
