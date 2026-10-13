import { mergeRouters, router } from '../../init'
import { capabilityMutations } from './mutations'
import { capabilityQueries } from './queries'

export const capabilitiesRouter = mergeRouters(router({}), capabilityQueries, capabilityMutations)
