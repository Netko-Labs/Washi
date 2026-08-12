import {
  IconAlertTriangle,
  IconCheck,
  IconChevronRight,
  IconLoader2,
  IconX,
} from '@tabler/icons-react'
import type { AgentUpdate, TranscriptEntry } from '@washi/desktop-domain'

function ToolStatusIcon({ status }: { status: string }) {
  if (status === 'completed') return <IconCheck className="size-3.5 text-green-600" />
  if (status === 'failed') return <IconX className="size-3.5 text-destructive" />
  return <IconLoader2 className="size-3.5 animate-spin text-muted-foreground" />
}

function DiffView({ diff }: { diff: { path: string; oldText: string; newText: string } }) {
  return (
    <div className="mt-1 overflow-hidden rounded-md border border-border text-xs">
      <div className="border-border border-b bg-muted/60 px-2 py-1 font-medium">
        proposed change · {diff.path}
      </div>
      <div className="grid grid-cols-2 divide-x divide-border">
        <pre className="max-h-48 overflow-auto bg-destructive/5 p-2 whitespace-pre-wrap">
          {diff.oldText}
        </pre>
        <pre className="max-h-48 overflow-auto bg-green-500/5 p-2 whitespace-pre-wrap">
          {diff.newText}
        </pre>
      </div>
    </div>
  )
}

const KIND_SPINES: Record<string, string> = {
  read: 'border-l-tape-teal',
  edit: 'border-l-tape-pink',
  search: 'border-l-tape-blue',
  fetch: 'border-l-tape-violet',
  execute: 'border-l-tape-mustard',
  delete: 'border-l-destructive',
  think: 'border-l-tape-slate',
  other: 'border-l-tape-slate',
}

function ToolCard({ update, followups }: { update: AgentUpdate; followups: AgentUpdate[] }) {
  if (update.kind !== 'tool_call') return null
  const latest = followups.at(-1)
  const status = latest?.kind === 'tool_call_update' ? latest.status : update.status
  const diff = followups.find(
    (item): item is Extract<AgentUpdate, { kind: 'tool_call_update' }> =>
      item.kind === 'tool_call_update' && item.diff != null,
  )?.diff
  const output = followups
    .filter(
      (item): item is Extract<AgentUpdate, { kind: 'tool_call_update' }> =>
        item.kind === 'tool_call_update' && !!item.output,
    )
    .at(-1)?.output

  return (
    <div
      className={`my-1 rounded-md border border-border border-l-3 bg-card px-2 py-1.5 shadow-sm ${
        KIND_SPINES[update.toolKind] ?? KIND_SPINES.other
      }`}
      data-tool-card
    >
      <details>
        <summary className="flex cursor-pointer items-center gap-1.5 text-xs">
          <IconChevronRight className="size-3 transition-transform [details[open]>summary>&]:rotate-90" />
          <ToolStatusIcon status={status} />
          <span className="font-mono font-medium">{update.title}</span>
          <span className="ml-auto text-muted-foreground">{update.toolKind}</span>
        </summary>
        <div className="mt-1 space-y-1 pl-4">
          {update.input != null && (
            <pre className="max-h-32 overflow-auto rounded bg-muted p-1.5 text-xs">
              {JSON.stringify(update.input, null, 2)}
            </pre>
          )}
          {output && (
            <pre className="max-h-32 overflow-auto rounded bg-muted p-1.5 text-muted-foreground text-xs">
              {output}
            </pre>
          )}
        </div>
      </details>
      {diff && <DiffView diff={diff} />}
    </div>
  )
}

export function TranscriptView({ transcript }: { transcript: TranscriptEntry[] }) {
  const followupsFor = (toolCallId: string) =>
    transcript
      .map((entry) => entry.update)
      .filter((update) => update.kind === 'tool_call_update' && update.toolCallId === toolCallId)

  return (
    <div className="flex flex-col gap-1 px-3 py-2">
      {transcript.map((entry) => {
        const { update } = entry
        switch (update.kind) {
          case 'user_message':
            return (
              <div
                key={entry.id}
                className="my-1 ml-8 rounded-lg rounded-br-sm border border-primary/15 bg-primary/10 px-3 py-2 text-sm"
              >
                {update.text}
              </div>
            )
          case 'message_chunk':
            return (
              <div key={entry.id} className="my-1 mr-4 whitespace-pre-wrap text-sm">
                {update.text}
              </div>
            )
          case 'tool_call':
            return (
              <ToolCard
                key={entry.id}
                update={update}
                followups={followupsFor(update.toolCallId)}
              />
            )
          case 'turn_done':
            return update.stopReason === 'error' ? (
              <div
                key={entry.id}
                className="my-1 flex items-center gap-1.5 text-destructive text-xs"
              >
                <IconAlertTriangle className="size-3.5" />
                {update.error ?? 'the turn failed'}
              </div>
            ) : (
              <div
                key={entry.id}
                className="my-2 flex items-center gap-2 font-mono text-[10px] text-muted-foreground uppercase tracking-widest"
              >
                <span className="h-px flex-1 bg-border" />
                done{update.costUsd != null ? ` · $${update.costUsd.toFixed(4)}` : ''}
                <span className="h-px flex-1 bg-border" />
              </div>
            )
          default:
            return null
        }
      })}
      {transcript.length === 0 && (
        <div className="px-1 py-6 text-center text-muted-foreground text-sm">
          Ask the agent to create or edit sheets, define tables, or fetch data.
        </div>
      )}
    </div>
  )
}
