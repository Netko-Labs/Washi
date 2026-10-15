import { useEffect, useState } from 'react'
import { api } from '@/integrations/trpc'
import type { PagePresence } from '../types'

const BEAT_MS = 15_000

/** Who else is on this page: a beat every 15s says "still here", pushes say who came and went. */
export function usePresence(sheetId: string, editing: boolean): PagePresence[] {
  const [people, setPeople] = useState<{ sheetId: string; list: PagePresence[] }>({
    sheetId,
    list: [],
  })

  useEffect(() => {
    let alive = true
    let me: string | null = null
    const show = (list: PagePresence[]) =>
      alive && setPeople({ sheetId, list: list.filter((person) => person.id !== me) })
    const beat = () =>
      api.live.here
        .mutate({ sheetId, editing })
        .then(show)
        .catch(() => undefined)

    void api.workspaces.me.query().then((who) => {
      me = who.actor?.id ?? 'local'
      void beat()
    })
    const timer = setInterval(() => void beat(), BEAT_MS)
    const pushes = api.live.onPresence.subscribe(undefined, {
      onData: ({ data }) => data.sheetId === sheetId && show(data.people),
    })
    return () => {
      alive = false
      clearInterval(timer)
      pushes.unsubscribe()
      void api.live.leave.mutate({ sheetId }).catch(() => undefined)
    }
  }, [sheetId, editing])

  return people.sheetId === sheetId ? people.list : []
}
