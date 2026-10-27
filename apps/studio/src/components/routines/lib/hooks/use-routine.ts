import { useNavigate } from '@tanstack/react-router'
import type { RoutineRun } from '@washi/domain'
import { useCallback, useEffect, useState } from 'react'
import { api } from '@/integrations/trpc'
import { RUNS_POLL_MS } from '../constants'
import type { RoutineDraft, RoutineSaveState, RoutineWire } from '../types'
import { cronFromSchedule, draftFrom } from '../utils'
import { ROUTINE_TEMPLATES } from '../values'

/**
 * One routine as a page: the saved routine, a draft the Setup tab edits, its runs (reread while
 * one is still going), and the verbs. A new one becomes a page of its own on its first save.
 */
export function useRoutine(workspaceId: string, routineId?: string, templateKey?: string) {
  const navigate = useNavigate()
  const [routine, setRoutine] = useState<RoutineWire | null>(null)
  const [draft, setDraft] = useState<RoutineDraft>(() =>
    draftFrom(
      null,
      ROUTINE_TEMPLATES.find((template) => template.key === templateKey),
    ),
  )
  const [runs, setRuns] = useState<RoutineRun[]>([])
  const [state, setState] = useState<RoutineSaveState>({
    isSaving: false,
    error: null,
    missing: false,
  })

  const load = useCallback(async () => {
    if (!routineId) return
    const [all, history] = await Promise.all([
      api.routines.list.query(),
      api.routines.runs.query({ id: routineId }),
    ])
    const found = all.find((each) => each.id === routineId) ?? null
    setRoutine(found)
    setRuns(history)
    if (!found) setState((current) => ({ ...current, missing: true }))
    return found
  }, [routineId])

  useEffect(() => {
    void load().then((found) => {
      if (found) setDraft(draftFrom(found, undefined))
    })
  }, [load])

  const isGoing = runs.some((run) => run.status === 'running' || run.status === 'waiting')
  useEffect(() => {
    if (!isGoing) return
    const timer = setInterval(() => void load(), RUNS_POLL_MS)
    return () => clearInterval(timer)
  }, [isGoing, load])

  const attempt = async (action: () => Promise<void>) => {
    setState((current) => ({ ...current, isSaving: true, error: null }))
    try {
      await action()
      setState((current) => ({ ...current, isSaving: false }))
    } catch (cause) {
      const error = cause instanceof Error ? cause.message : String(cause)
      setState((current) => ({ ...current, isSaving: false, error }))
    }
  }

  const fields = () => ({
    title: draft.title.trim() || 'Untitled routine',
    prompt: draft.prompt.trim(),
    cron: cronFromSchedule(draft.schedule),
    timeZone: draft.schedule.timeZone,
  })

  const save = () =>
    attempt(async () => {
      if (!routineId) {
        const created = await api.routines.create.mutate(fields())
        await navigate({
          to: '/w/$workspaceId/routines/$routineId',
          params: { workspaceId, routineId: created.id },
          search: { tab: 'setup' },
          replace: true,
        })
        return
      }
      setRoutine(await api.routines.update.mutate({ id: routineId, ...fields() }))
    })

  const isChanged =
    !routine ||
    routine.title !== fields().title ||
    routine.prompt !== fields().prompt ||
    routine.cron !== fields().cron ||
    routine.timeZone !== fields().timeZone

  return {
    routine,
    draft,
    setDraft,
    runs,
    ...state,
    isChanged,
    save,
    runNow: () =>
      attempt(async () => {
        if (routineId) await api.routines.runNow.mutate({ id: routineId })
        await load()
      }),
    toggle: (enabled: boolean) =>
      attempt(async () => {
        if (routineId) setRoutine(await api.routines.setEnabled.mutate({ id: routineId, enabled }))
      }),
    remove: () =>
      attempt(async () => {
        if (routineId) await api.routines.remove.mutate({ id: routineId })
        await navigate({ to: '/w/$workspaceId/routines', params: { workspaceId } })
      }),
  }
}
