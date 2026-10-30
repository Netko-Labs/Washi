import {
  embedHosts,
  playableEmbedHosts,
  serverPolicy,
  widgetHosts,
  widgetsByServer,
  widgetsEnabled,
} from '@washi/service'
import { router, workspaceProcedure } from '../../init'

export const embedQueries = router({
  hosts: workspaceProcedure.query(({ ctx }) => embedHosts(ctx.ws)),
  /** This workspace's sites and the server's: what a page here may play. */
  playable: workspaceProcedure.query(({ ctx }) => playableEmbedHosts(ctx.ws)),
  widgets: workspaceProcedure.query(({ ctx }) => widgetsEnabled(ctx.ws)),
  /** Sites this workspace's widgets may reach, past the server's (D118). */
  widgetHosts: workspaceProcedure.query(({ ctx }) => widgetHosts(ctx.ws)),
  /** What the server says over every workspace, for the settings that defer to it. */
  server: workspaceProcedure.query(({ ctx }) => ({
    hosts: serverPolicy(ctx.ws).embedHosts,
    widgetHosts: serverPolicy(ctx.ws).widgetHosts,
    widgets: widgetsByServer(ctx.ws),
  })),
})
