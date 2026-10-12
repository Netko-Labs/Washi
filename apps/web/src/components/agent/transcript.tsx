import { IconTool, IconX } from '@tabler/icons-react'
import { mergeMessageChunks, type TranscriptEntryView } from './lib'
import { ProposedEdit } from './proposed-edit'
import { TurnReceipt } from './turn-receipt'

/**
 * Un-bubbled: the agent's prose is the page's prose. Tool calls are pills, not
 * paragraphs, because what matters is *that* it touched something and whether
 * you let it.
 */
export function Transcript({ entries }: { entries: TranscriptEntryView[] }) {
  if (entries.length === 0) {
    return (
      <div className="grid flex-1 place-items-center px-6 text-center">
        <div className="max-w-xs">
          <p className="font-bold text-[14px]">Ask me anything</p>
          <p className="mt-1.5 text-[13px] text-muted-foreground leading-relaxed">
            Describe a page and I'll design it. There is no cursor here — tell me what to change and
            I'll change it.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-1 flex-col gap-3 overflow-y-auto px-4 py-4">
      {mergeMessageChunks(entries).map((entry) => (
        <Entry key={entry.id} entry={entry} />
      ))}
    </div>
  )
}

function Entry({ entry }: { entry: TranscriptEntryView }) {
  const update = entry.update

  if (update.kind === 'user_message') {
    return (
      <p className="self-end rounded-2xl bg-accent px-3.5 py-2 text-[13.5px] leading-relaxed">
        {update.text}
      </p>
    )
  }

  if (update.kind === 'message_chunk') {
    return <p className="text-[13.5px] leading-relaxed">{update.text}</p>
  }

  if (update.kind === 'tool_call') {
    return (
      <p className="inline-flex items-center gap-1.5 self-start rounded-full border border-border px-2.5 py-1 font-mono text-[11px] text-muted-foreground">
        <IconTool className="size-3" />
        {update.title}
      </p>
    )
  }

  if (update.kind === 'tool_call_update' && update.diff) {
    return <ProposedEdit diff={update.diff} />
  }

  if (update.kind === 'turn_done') {
    if (update.stopReason === 'error') {
      return (
        <p className="flex items-start gap-1.5 rounded-xl bg-destructive/10 px-3 py-2 text-[12.5px] text-destructive leading-relaxed">
          <IconX className="mt-0.5 size-3.5 shrink-0" />
          {update.error ?? 'That turn failed.'}
        </p>
      )
    }
    return <TurnReceipt update={update} />
  }

  return null
}
