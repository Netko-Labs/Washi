import { accessSync, constants } from 'node:fs'
import { homedir } from 'node:os'
import { join } from 'node:path'
import type { LocalCliStatus } from '../lib'
import { agentEnv } from '../lib'
import { CLAUDE_PATH_ENV, PROBE_TIMEOUT_MS, PROBE_TTL_MS } from './constants'
import type { LocalCliProbe, ProbeDeps } from './types'

/**
 * A GUI app inherits launchd's PATH, not the shell's, so `which` alone misses
 * every user-level install. The known install locations are checked after it.
 */
function defaultCandidates(): string[] {
  const home = homedir()
  const fromPath = Bun.which('claude')
  return [
    process.env[CLAUDE_PATH_ENV],
    fromPath,
    join(home, '.local', 'bin', 'claude'),
    join(home, '.claude', 'local', 'claude'),
    '/opt/homebrew/bin/claude',
    '/usr/local/bin/claude',
  ].filter((path): path is string => Boolean(path))
}

function isExecutable(path: string): boolean {
  try {
    accessSync(path, constants.X_OK)
    return true
  } catch {
    return false
  }
}

async function run(argv: string[]): Promise<string | null> {
  try {
    const child = Bun.spawn(argv, {
      env: agentEnv(null),
      stdout: 'pipe',
      stderr: 'ignore',
      timeout: PROBE_TIMEOUT_MS,
    })
    const [out, code] = await Promise.all([new Response(child.stdout).text(), child.exited])
    return code === 0 ? out : null
  } catch {
    return null
  }
}

export const SYSTEM_PROBE_DEPS: ProbeDeps = { candidates: defaultCandidates, isExecutable, run }

export function parseVersion(raw: string | null): string | null {
  return raw?.match(/\d+\.\d+\.\d+/)?.[0] ?? null
}

/** `auth status` also prints the account email. It is read past, never kept. */
export function parseAuthStatus(
  raw: string | null,
): Pick<LocalCliStatus, 'loggedIn' | 'authMethod' | 'plan'> {
  try {
    const parsed = JSON.parse(raw ?? '') as Record<string, unknown>
    return {
      loggedIn: parsed.loggedIn === true,
      authMethod: typeof parsed.authMethod === 'string' ? parsed.authMethod : null,
      plan: typeof parsed.subscriptionType === 'string' ? parsed.subscriptionType : null,
    }
  } catch {
    return { loggedIn: false, authMethod: null, plan: null }
  }
}

export async function probeLocalCli(
  deps: ProbeDeps = SYSTEM_PROBE_DEPS,
): Promise<LocalCliStatus | null> {
  const executable = deps.candidates().find((path) => deps.isExecutable(path))
  if (!executable) return null
  const [version, auth] = await Promise.all([
    deps.run([executable, '--version']),
    deps.run([executable, 'auth', 'status', '--json']),
  ])
  return { executable, version: parseVersion(version), ...parseAuthStatus(auth) }
}

export function cachedProbe(deps: ProbeDeps = SYSTEM_PROBE_DEPS): LocalCliProbe {
  let cached: { at: number; value: LocalCliStatus | null } | null = null
  return async () => {
    if (cached && Date.now() - cached.at < PROBE_TTL_MS) return cached.value
    const value = await probeLocalCli(deps)
    cached = { at: Date.now(), value }
    return value
  }
}
