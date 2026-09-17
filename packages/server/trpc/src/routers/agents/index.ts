import { mergeRouters, router } from '../../init'
import { agentMutations } from './mutations'
import { agentQueries } from './queries'
import { agentSubscriptions } from './subscriptions'

export const agentsRouter = mergeRouters(
  router({}),
  agentQueries,
  agentMutations,
  agentSubscriptions,
)
