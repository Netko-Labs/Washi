import { storageConfigSchema } from '@washi/domain'
import type { StorageDraft } from './types'
import { STORAGE_FIELDS } from './values'

/** The draft as the server will read it, or the first field it would refuse, in words. */
export function parseDraft(draft: StorageDraft) {
  const parsed = storageConfigSchema.safeParse(draft)
  if (parsed.success) return { config: parsed.data, refusal: null }
  const issue = parsed.error.issues[0]
  const field = STORAGE_FIELDS.find((spec) => spec.key === issue?.path[0])
  const what = issue?.code === 'too_small' ? 'is needed' : (issue?.message ?? 'is not right')
  return { config: null, refusal: `${field?.label ?? 'A field'}: ${what}.` }
}

/** `bucket/folder at host` — where a file lands, in one line. */
export function placeOf(view: { endpoint: string; bucket: string; prefix: string | null }): string {
  const host = URL.canParse(view.endpoint) ? new URL(view.endpoint).host : view.endpoint
  return `${view.bucket}${view.prefix ? `/${view.prefix}` : ''} at ${host}`
}
