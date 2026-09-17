import { homedir } from 'node:os'
import { join } from 'node:path'
import { startServer } from './index'
import { assertMode } from './lib/mode'

const mode = assertMode(process.env.WASHI_MODE)
const dataDir = process.env.WASHI_DATA_DIR ?? join(homedir(), '.washi', 'workspaces')

const server = startServer({
  mode,
  dataDir,
  hostname: process.env.WASHI_HOSTNAME,
  port: process.env.WASHI_PORT ? Number(process.env.WASHI_PORT) : undefined,
})

console.log(`[washi] ${server.mode} server on ${server.url} — workspaces in ${dataDir}`)

for (const signal of ['SIGINT', 'SIGTERM'] as const) {
  process.on(signal, () => {
    void server.stop().then(() => process.exit(0))
  })
}
