import { mergeRouters, router } from '../../init'
import { workspaceMutations } from './mutations'
import { workspaceQueries } from './queries'

export const workspacesRouter = mergeRouters(router({}), workspaceQueries, workspaceMutations)
