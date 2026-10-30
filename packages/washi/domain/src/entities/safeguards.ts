import { z } from 'zod'

/** A host list entry meaning every site (D118); tsuru matches it as its own. */
export const ANY_HOST = '*'

/** What the server's admin may lift (D118); a field is true once lifted, so each holds by default. */
export const SAFEGUARDS = ['privateNetwork', 'approveAll'] as const
export type Safeguard = (typeof SAFEGUARDS)[number]

/** Every safeguard holding — a fresh server, and embedded. */
export const SAFEGUARDS_ON: Safeguards = { privateNetwork: false, approveAll: false }

export const safeguardSchema = z.enum(SAFEGUARDS)
export const safeguardsSchema = z.object({ privateNetwork: z.boolean(), approveAll: z.boolean() })
export type Safeguards = z.infer<typeof safeguardsSchema>

/** Each limit as the admin types it, between a floor that still runs and a ceiling that still holds. */
export const codeLimitsSchema = z.object({
  pageMemoryMb: z.number().int().min(8).max(256),
  pageDrawMs: z.number().int().min(10).max(2000),
  pageBundleKb: z.number().int().min(64).max(4096),
  automationMemoryMb: z.number().int().min(4).max(256),
  automationMs: z.number().int().min(10).max(5000),
  formulaMs: z.number().int().min(1).max(1000),
  widgetBundleKb: z.number().int().min(64).max(8192),
  fileReadMb: z.number().int().min(1).max(512),
  imageMb: z.number().int().min(1).max(512),
  videoMb: z.number().int().min(1).max(512),
  audioMb: z.number().int().min(1).max(512),
  fileMb: z.number().int().min(1).max(512),
})
export type CodeLimits = z.infer<typeof codeLimitsSchema>
export type CodeLimit = keyof CodeLimits

/** Today's constants (D95, D97, D99, D100, D113, D119): what a server nobody tuned runs on. */
export const CODE_LIMITS: CodeLimits = {
  pageMemoryMb: 32,
  pageDrawMs: 100,
  pageBundleKb: 768,
  automationMemoryMb: 16,
  automationMs: 100,
  formulaMs: 20,
  widgetBundleKb: 768,
  fileReadMb: 32,
  imageMb: 10,
  videoMb: 50,
  audioMb: 25,
  fileMb: 25,
}

/** What the audit trail names: a switch, the limits, or a host list that gained or lost `*`. */
export type SafeguardSubject = Safeguard | 'limits' | 'fetchHosts' | 'embedHosts' | 'widgetHosts'

/** One change: which, whether it now lifts a guard, by whom, when. */
export interface SafeguardChange {
  which: SafeguardSubject
  on: boolean
  by: string
  at: string
}

/** Reads each switch on its own: only a literal `true` lifts one, anything else keeps it. */
export function readSafeguards(raw: unknown): Safeguards {
  const stored = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {}
  return Object.fromEntries(SAFEGUARDS.map((key) => [key, stored[key] === true])) as Safeguards
}

/** Reads each limit on its own: one out of range falls back to today's constant alone. */
export function readCodeLimits(raw: unknown): CodeLimits {
  const stored = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {}
  const field = codeLimitsSchema.shape
  return Object.fromEntries(
    (Object.keys(CODE_LIMITS) as CodeLimit[]).map((key) => [
      key,
      field[key].safeParse(stored[key]).data ?? CODE_LIMITS[key],
    ]),
  ) as CodeLimits
}
