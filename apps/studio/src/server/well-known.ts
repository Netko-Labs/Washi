import { defineHandler } from 'nitro/h3'
import { washiRuntime } from './runtime'

// Mounted at /.well-known/** by the nitro plugin in vite.config.ts: what an agent reads before it
// signs in (D101) — the authorization server, OpenID and the MCP resource's metadata.
export default defineHandler(async (event) => {
  const { runtime } = await washiRuntime()
  const found = await runtime.control.oauth?.discovery(event.req)
  return found ?? new Response(null, { status: 404 })
})
