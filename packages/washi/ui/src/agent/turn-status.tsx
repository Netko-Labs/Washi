import { IconAlertTriangle, IconPlayerStopFilled, IconRefresh } from '@tabler/icons-react'
import { AgentMascot } from '../mascot'
import { useAgentStore, useNoticeStore } from '../stores'
import { type TurnStatusProps, useElapsed, useTurnView } from './lib'

const ACTION =
  'inline-flex h-7 items-center gap-1 rounded-full border border-border bg-card px-2.5 font-medium text-[12px] text-foreground hover:bg-accent max-md:h-9'

const sayFailure = (error: unknown) =>
  useNoticeStore.getState().say(error instanceof Error ? error.message : String(error))
const retry = () => void useAgentStore.getState().retryTurn().catch(sayFailure)
const stop = () => void useAgentStore.getState().stopTurn().catch(sayFailure)

/** How the chat on screen stands at its end: working, gone quiet, or failed — each in words (D114). */
export function TurnStatus({ variant, mark = true }: TurnStatusProps) {
  const view = useTurnView()
  const elapsed = useElapsed(
    view.state === 'idle' || view.state === 'failed' ? null : view.startedAt,
  )
  const isPage = variant === 'page'
  const type = isPage ? 'text-[14px]' : 'text-[12px]'
  const markSize = isPage ? 26 : 20

  if (view.state === 'idle') return null

  if (view.state === 'failed') {
    return (
      <div
        data-turn-status="failed"
        role="alert"
        className={`flex items-start gap-2 rounded-xl border border-destructive/30 bg-destructive/5 px-3 py-2.5 ${type} ${isPage ? 'sm:ml-[42px]' : 'mx-4 mb-3'}`}
      >
        <IconAlertTriangle className="mt-0.5 size-4 shrink-0 text-destructive" />
        <p className="min-w-0 flex-1 break-words text-destructive">{view.failureText}</p>
        {view.canRetry && (
          <button type="button" onClick={retry} className={ACTION}>
            <IconRefresh className="size-3.5" />
            Retry
          </button>
        )}
      </div>
    )
  }

  if (view.state === 'stalled') {
    return (
      <div
        data-turn-status="stalled"
        role="status"
        className={`flex flex-wrap items-center gap-2 text-muted-foreground ${type} ${isPage ? (mark ? 'sm:gap-4' : 'sm:pl-[42px]') : 'px-4 pb-3'}`}
      >
        {mark && <AgentMascot state="flagged" size={markSize} />}
        <span className="min-w-0 flex-1">
          Washi hasn't said anything for a while
          {elapsed && <span className="ml-1.5 tabular-nums">· {elapsed}</span>}
        </span>
        <span className="flex gap-1.5">
          <button type="button" onClick={stop} className={ACTION}>
            <IconPlayerStopFilled className="size-3" />
            Stop
          </button>
          {view.canRetry && (
            <button type="button" onClick={retry} className={ACTION}>
              <IconRefresh className="size-3.5" />
              Retry
            </button>
          )}
        </span>
      </div>
    )
  }

  return (
    <div
      data-turn-status="working"
      role="status"
      className={`flex items-center gap-2 text-muted-foreground ${type} ${isPage ? (mark ? 'gap-3 sm:gap-4' : 'sm:pl-[42px]') : 'px-4 pb-3'}`}
    >
      {mark && <AgentMascot state={isPage ? 'thinking' : 'writing'} size={markSize} />}
      <span className="animate-pulse">Working…</span>
      {elapsed && <span className="tabular-nums">{elapsed}</span>}
    </div>
  )
}
