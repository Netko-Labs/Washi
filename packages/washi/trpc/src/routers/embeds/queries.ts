import {
  embedHosts,
  playableEmbedHosts,
  serverPolicy,
  widgetsByServer,
  widgetsEnabled,
} from '@washi/service'
import { router, workspaceProcedure } from '../../init'

export const embedQueries = router({
  hosts: workspaceProcedure.query(({ ctx }) => embedHosts(ctx.ws)),
  /** This workspace's sites and the server's: what a page here may play. */
  playable: workspaceProcedure.query(({ ctx }) => playableEmbedHosts(ctx.ws)),
  widgets: workspaceProcedure.query(({ ctx }) => widgetsEnabled(ctx.ws)),
  /** What the server says over every workspace, for the settings that defer to it. */
  server: workspaceProcedure.query(({ ctx }) => ({
    hosts: serverPolicy(ctx.ws).embedHosts,
    widgets: widgetsByServer(ctx.ws),
  })),
})
