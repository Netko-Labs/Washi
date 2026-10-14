/**
 * `env` on query() REPLACES the subprocess environment rather than merging, so
 * spreading process.env would hand a multi-tenant agent WASHI_SECRET_KEY, the
 * Postgres url and every other server secret. The subprocess gets an allowlist
 * of what a process needs to run, plus the one key it is meant to use.
 */
const INHERITED = [
  'PATH',
  'HOME',
  'SHELL',
  'LANG',
  'LC_ALL',
  'TMPDIR',
  'TERM',
  'USER',
  'NODE_OPTIONS',
  'SSL_CERT_FILE',
  'SSL_CERT_DIR',
  // Where a local Claude login lives, when it is not ~/.claude.
  'CLAUDE_CONFIG_DIR',
] as const

export function agentEnv(apiKey: string | null, configDir?: string | null): Record<string, string> {
  const env: Record<string, string> = {}
  for (const name of INHERITED) {
    const value = process.env[name]
    if (value) env[name] = value
  }
  env.CLAUDE_AGENT_SDK_CLIENT_APP = 'washi/0.1.0'
  if (apiKey) env.ANTHROPIC_API_KEY = apiKey
  if (configDir) env.CLAUDE_CONFIG_DIR = configDir
  return env
}

/**
 * Where a keyed turn's Claude session lives: beside the workspace file, so it
 * survives a redeploy with the `sdkSessionId` that points at it. A local CLI
 * never gets one — its config dir is the person's own login.
 */
export function sessionConfigDir(databaseFile: string): string | null {
  if (!databaseFile || databaseFile === ':memory:') return null
  return `${databaseFile.replace(/\.db$/, '')}.claude`
}
