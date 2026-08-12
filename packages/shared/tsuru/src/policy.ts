import { z } from 'zod'

export const fetchPolicySchema = z.object({
  /** Hostnames (exact or `*.suffix`) the workspace has approved. */
  allowedHosts: z.array(z.string().min(1)).default([]),
  maxResponseBytes: z.number().int().positive().default(1_048_576),
  timeoutMs: z.number().int().positive().max(60_000).default(15_000),
})
export type FetchPolicy = z.infer<typeof fetchPolicySchema>

export type PolicyVerdict =
  | { ok: true; url: URL }
  | { ok: false; reason: string; needsApproval?: boolean }

const PRIVATE_V4 = [
  /^0\./,
  /^10\./,
  /^127\./,
  /^169\.254\./,
  /^172\.(1[6-9]|2\d|3[01])\./,
  /^192\.168\./,
]

export function isPrivateAddress(host: string): boolean {
  const bare = host.replace(/^\[|\]$/g, '').toLowerCase()
  if (bare === 'localhost' || bare.endsWith('.localhost') || bare.endsWith('.local')) return true
  if (bare === '::1' || bare === '::') return true
  // IPv4-mapped IPv6 (::ffff:10.0.0.1) and plain v4
  const v4 = bare.match(/(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})$/)?.[1]
  if (v4) return PRIVATE_V4.some((range) => range.test(v4))
  // Unique-local / link-local IPv6
  if (/^(fc|fd|fe8|fe9|fea|feb)/.test(bare)) return true
  return false
}

function hostAllowed(host: string, allowed: string[]): boolean {
  return allowed.some((entry) =>
    entry.startsWith('*.') ? host.endsWith(entry.slice(1)) : host === entry,
  )
}

/**
 * Gate a URL against the policy. https-only, never loopback/private ranges —
 * the mirin RPC WebSocket and MCP loopback servers live there (spec §5).
 */
export function checkUrl(rawUrl: string, policy: FetchPolicy): PolicyVerdict {
  let url: URL
  try {
    url = new URL(rawUrl)
  } catch {
    return { ok: false, reason: 'invalid URL' }
  }
  if (url.protocol !== 'https:') return { ok: false, reason: 'https only' }
  if (url.username || url.password) return { ok: false, reason: 'credentials in URL' }
  if (url.port && url.port !== '443') return { ok: false, reason: 'non-standard port' }
  if (isPrivateAddress(url.hostname)) {
    return { ok: false, reason: 'private and loopback addresses are blocked' }
  }
  if (!hostAllowed(url.hostname, policy.allowedHosts)) {
    return {
      ok: false,
      reason: `host "${url.hostname}" is not on the allowlist`,
      needsApproval: true,
    }
  }
  return { ok: true, url }
}
