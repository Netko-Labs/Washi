import { IconAlertTriangle } from '@tabler/icons-react'
import type { AgentUpdate } from '@washi/domain'
import { useDescribeTool } from '../approval'
import { Markdown } from '../markdown'
import { Mascot } from '../mascot'
import {
  type DiffViewProps,
  mergeMessageChunks,
  type ToolPillProps,
  type TranscriptViewProps,
} from './lib'

function DiffView({ diff }: DiffViewProps) {
  return (
    <div className="my-1.5 overflow-hidden rounded-xl border border-agent text-[12px]">
      <div className="border-border border-b bg-muted px-3 py-1.5 font-medium">
        Washi suggests an edit · {diff.path}
      </div>
      <div className="max-h-44 space-y-1 overflow-auto p-2.5">
        <pre className="whitespace-pre-wrap rounded-md bg-[rgb(231_0_11/0.08)] px-2 py-1 text-muted-foreground line-through">
          {diff.oldText.slice(0, 600)}
        </pre>
        <pre className="whitespace-pre-wrap rounded-md bg-[rgb(34_197_94/0.12)] px-2 py-1">
          {diff.newText.slice(0, 600)}
        </pre>
      </div>
    </div>
  )
}

function ToolPill({ update, followups }: ToolPillProps) {
  const describe = useDescribeTool()
  if (update.kind !== 'tool_call') return null
  const { icon: Icon, action, subject } = describe(update.title, update.input)
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
    <div className="my-1" data-tool-card>
      <details>
        <summary
          className={`inline-flex h-6 cursor-pointer list-none items-center gap-1.5 rounded-full bg-muted px-2.5 font-medium text-[11px] text-muted-foreground ${
            status === 'failed' ? 'text-destructive' : ''
          }`}
        >
          <Icon className="size-[13px] shrink-0" />
          <span className="max-w-[260px] truncate" title={update.title}>
            {action}
            {subject && ` ${subject}`}
          </span>
          {status === 'in_progress' && <span className="animate-pulse">…</span>}
        </summary>
        {output && (
          <pre className="mt-1 max-h-32 overflow-auto rounded-lg bg-muted p-2 text-[11px] text-muted-foreground">
            {output}
          </pre>
        )}
      </details>
      {diff && <DiffView diff={diff} />}
    </div>
  )
}

export function TranscriptView({ transcript }: TranscriptViewProps) {
  const followupsFor = (toolCallId: string) =>
    transcript
      .map((entry) => entry.update)
      .filter((update) => update.kind === 'tool_call_update' && update.toolCallId === toolCallId)

  return (
    <div className="flex flex-col gap-1 px-4 py-4">
      {mergeMessageChunks(transcript).map((entry) => {
        const { update } = entry
        switch (update.kind) {
          case 'user_message':
            return (
              <div
                key={entry.id}
                className="my-1 max-w-[85%] self-end rounded-2xl rounded-br-md bg-muted px-3.5 py-2 text-[13px] leading-relaxed"
              >
                {update.attachments && update.attachments.length > 0 && (
                  <div className="mb-1 flex flex-wrap gap-1">
                    {update.attachments.map((ref) => (
                      <span
                        key={ref.id}
                        className="rounded-md bg-background/70 px-1.5 py-0.5 text-[11px] text-muted-foreground"
                      >
                        {ref.kind === 'page' ? '▯' : '⇪'} {ref.name}
                      </span>
                    ))}
                  </div>
                )}
                {update.text}
              </div>
            )
          case 'message_chunk':
            return (
              <div key={entry.id} className="my-1 text-[13.5px] leading-[1.7]">
                <Markdown text={update.text} />
              </div>
            )
          case 'tool_call':
            return (
              <ToolPill
                key={entry.id}
                update={update}
                followups={followupsFor(update.toolCallId)}
              />
            )
          // A turn ends in Washi's words; the receipt is recorded, never shown here (D62).
          case 'turn_done':
            return update.stopReason === 'error' ? (
              <div
                key={entry.id}
                className="my-1 flex items-center gap-1.5 text-[12px] text-destructive"
              >
                <IconAlertTriangle className="size-3.5" />
                {update.error ?? 'the turn failed'}
              </div>
            ) : null
          default:
            return null
        }
      })}
      {transcript.length === 0 && (
        <div className="flex flex-col items-center gap-3 px-2 py-10 text-center">
          <Mascot face="sleep" motion="breathe" size={72} className="mascot-motion" />
          <div className="font-serif text-[19px] text-foreground italic">All caught up</div>
          <p className="max-w-56 text-[13px] text-muted-foreground leading-relaxed">
            Ask Washi to draft, tidy, or link your pages — nothing lands without your accept.
          </p>
        </div>
      )}
    </div>
  )
}
