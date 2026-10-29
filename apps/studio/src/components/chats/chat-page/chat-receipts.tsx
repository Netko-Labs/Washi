import { IconChevronRight } from '@tabler/icons-react'
import { useDescribeTool } from '@washi/ui'
import { type ChatReceiptsProps, pastTense, receiptSummary } from './lib'

/** A run of tool calls as one quiet line in words; open it for each call. */
export function ChatReceipts({ steps }: ChatReceiptsProps) {
  const describe = useDescribeTool()
  const lines = steps.map((step) => {
    const { icon, action, subject } = describe(step.name, step.input)
    return { step, icon, phrase: `${pastTense(action)}${subject ? ` ${subject}` : ''}` }
  })
  const { head, more } = receiptSummary(lines.map((line) => line.phrase))
  const isWorking = steps.some((step) => step.status === 'pending' || step.status === 'in_progress')
  const failed = steps.filter((step) => step.status === 'failed').length
  const Lead = lines[0]?.icon

  return (
    <details className="group/receipts my-1 text-[13px] text-muted-foreground" data-tool-receipts>
      <summary className="-mx-2 flex min-h-11 cursor-pointer list-none items-center gap-2 rounded-lg px-2 hover:text-foreground md:min-h-8 [&::-webkit-details-marker]:hidden">
        {Lead && <Lead className="size-4 shrink-0" />}
        <span className="min-w-0 truncate">
          {head}
          {more > 0 && ` · ${more} more`}
        </span>
        {isWorking && <span className="animate-pulse">…</span>}
        {failed > 0 && <span className="shrink-0 text-destructive">· {failed} failed</span>}
        <IconChevronRight className="size-3.5 shrink-0 transition-transform group-open/receipts:rotate-90" />
      </summary>
      <ul className="mt-0.5 mb-2 ml-2 border-border border-l pl-3">
        {lines.map(({ step, icon: Icon, phrase }) => (
          <li
            key={step.id}
            className={`flex items-center gap-2 py-1 ${step.status === 'failed' ? 'text-destructive' : ''}`}
          >
            <Icon className="size-3.5 shrink-0" />
            <span className="min-w-0 truncate" title={phrase}>
              {phrase}
            </span>
            {step.status === 'failed' && <span className="shrink-0">· failed</span>}
            {step.status === 'in_progress' && <span className="animate-pulse">…</span>}
          </li>
        ))}
      </ul>
    </details>
  )
}
