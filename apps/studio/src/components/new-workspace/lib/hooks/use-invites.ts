import { useState } from 'react'
import { auth } from '@/integrations/auth'
import type { InviteDraft, SentInvite } from '../types'
import { FIRST_INVITES } from '../values'

const draft = (key: number): InviteDraft => ({ key, email: '', role: 'member' })

/** Rows of email + role; sending makes one invitation each, and keeps the rows that failed. */
export function useInvites(workspaceId: string) {
  const [drafts, setDrafts] = useState<InviteDraft[]>(() =>
    Array.from({ length: FIRST_INVITES }, (_, key) => draft(key)),
  )
  const [sent, setSent] = useState<SentInvite[]>([])
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const edit = (key: number, patch: Partial<InviteDraft>) =>
    setDrafts((rows) => rows.map((row) => (row.key === key ? { ...row, ...patch } : row)))
  const add = () =>
    setDrafts((rows) => [...rows, draft(Math.max(-1, ...rows.map((r) => r.key)) + 1)])
  const remove = (key: number) => setDrafts((rows) => rows.filter((row) => row.key !== key))

  const send = async () => {
    const filled = drafts.filter((row) => row.email.trim())
    if (filled.length === 0) return
    setBusy(true)
    setError(null)
    const failed: InviteDraft[] = []
    const made: SentInvite[] = []
    for (const row of filled) {
      const email = row.email.trim()
      const result = await auth.organization
        .inviteMember({ email, role: row.role, organizationId: workspaceId })
        .catch(() => null)
      if (result?.data?.id) made.push({ id: result.data.id, email, role: row.role })
      else {
        failed.push(row)
        setError(result?.error?.message ?? `Could not invite ${email}.`)
      }
    }
    setSent((before) => [...before, ...made])
    setDrafts(failed.length > 0 ? failed : [draft(0)])
    setBusy(false)
  }

  return { drafts, sent, busy, error, edit, add, remove, send }
}
