import type { ToolDescription } from '../types'

export const record = (value: unknown): Record<string, unknown> =>
  value && typeof value === 'object' ? (value as Record<string, unknown>) : {}

export const text = (value: unknown): string | null =>
  typeof value === 'string' && value.trim() ? value : null

/** The first readable value of a row — its title, usually. */
export function rowLabel(data: Record<string, unknown>): string | null {
  for (const value of Object.values(data)) {
    if (typeof value === 'string' && value.trim()) return value
  }
  return null
}

export function hostOf(url: string | null): string | null {
  if (!url) return null
  try {
    return new URL(url).hostname
  } catch {
    return url
  }
}

export const base = (
  partial: Partial<ToolDescription> & Pick<ToolDescription, 'icon' | 'action'>,
) => ({
  subject: null,
  details: [],
  outbound: false,
  preview: null,
  ...partial,
})
