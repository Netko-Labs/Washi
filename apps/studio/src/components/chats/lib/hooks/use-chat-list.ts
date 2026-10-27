import type { ChatSearchHit } from '@washi/domain'
import { useAgentStore } from '@washi/ui'
import { useEffect, useMemo, useState } from 'react'
import { api } from '@/integrations/trpc'
import { SEARCH_DEBOUNCE_MS } from '../constants'
import type { ChatFilter } from '../types'
import { groupByDay } from '../utils'

/** The list is the agent store's, kept live by `onSessionChanged`; search asks the server. */
export function useChatList() {
  const sessions = useAgentStore((state) => state.sessions)
  const approvals = useAgentStore((state) => state.approvals)
  const [filter, setFilter] = useState<ChatFilter>('all')
  const [term, setTerm] = useState('')
  const [hits, setHits] = useState<ChatSearchHit[] | null>(null)
  const [routineChats, setRoutineChats] = useState<Set<string>>(new Set())

  useEffect(() => {
    void api.routines.list
      .query()
      .then((routines) =>
        setRoutineChats(new Set(routines.flatMap((routine) => routine.sessionId ?? []))),
      )
  }, [])

  useEffect(() => {
    const text = term.trim()
    if (!text) {
      setHits(null)
      return
    }
    let isCurrent = true
    const timer = setTimeout(() => {
      void api.agents.searchChats.query({ text }).then((found) => {
        if (isCurrent) setHits(found)
      })
    }, SEARCH_DEBOUNCE_MS)
    return () => {
      isCurrent = false
      clearTimeout(timer)
    }
  }, [term])

  const waiting = useMemo(() => new Set(approvals.map((request) => request.sessionId)), [approvals])
  const groups = useMemo(() => {
    const shown = sessions.filter((chat) =>
      filter === 'routines'
        ? routineChats.has(chat.id)
        : filter === 'waiting'
          ? waiting.has(chat.id)
          : true,
    )
    return groupByDay(shown)
  }, [sessions, filter, routineChats, waiting])

  return { groups, hits, term, setTerm, filter, setFilter, routineChats, waiting }
}
