import { IconChevronDown, IconWorld } from '@tabler/icons-react'
import { useState } from 'react'
import { type ApprovalCardProps, useDescribeTool } from './lib'
import { PagePreview } from './page-preview'

/** One question from Washi, in words: what it wants to do, to what, and what it will look like. */
export function ApprovalCard({ toolName, input, onDecide, more = 0 }: ApprovalCardProps) {
  const describe = useDescribeTool()
  const [previewOpen, setPreviewOpen] = useState(true)
  const { icon: Icon, action, subject, details, outbound, preview } = describe(toolName, input)

  const always =
    toolName === 'fetch_url'
      ? 'Always allow this site'
      : toolName === 'web_search'
        ? 'Always allow web search'
        : 'Allow for this chat'

  return (
    <div className="overflow-hidden rounded-xl border border-agent bg-card" data-approval-card>
      <div className="flex gap-2.5 px-3 pt-3">
        <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-muted text-agent">
          <Icon className="size-4" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="text-[11.5px] text-muted-foreground">
            Washi wants to{more > 0 && ` · ${more} more waiting`}
          </div>
          <div className="text-[13.5px] leading-snug">
            {action}
            {subject && <span className="font-semibold"> {subject}</span>}
          </div>
          {details.map((detail) => (
            <div key={detail} className="mt-0.5 truncate text-[12px] text-muted-foreground">
              {detail}
            </div>
          ))}
        </div>
      </div>

      {preview && (
        <div className="px-3 pt-2.5">
          <button
            type="button"
            onClick={() => setPreviewOpen((open) => !open)}
            className="mb-1.5 flex items-center gap-1 text-[12px] text-muted-foreground hover:text-foreground"
          >
            <IconChevronDown
              className={`size-3.5 transition-transform ${previewOpen ? '' : '-rotate-90'}`}
            />
            {previewOpen ? 'Hide preview' : 'Show preview'}
          </button>
          {previewOpen && <PagePreview source={preview} />}
        </div>
      )}

      {outbound && (
        <p className="mx-3 mt-2.5 flex items-center gap-1.5 rounded-lg bg-muted px-2.5 py-1.5 text-[12px] text-muted-foreground">
          <IconWorld className="size-3.5 shrink-0" />
          This reaches outside your workspace, so it always asks.
        </p>
      )}

      <div className="mt-1 flex flex-wrap items-center gap-1.5 px-3 py-2.5">
        <button
          type="button"
          onClick={() => void onDecide('allow_always')}
          className="h-7 rounded-lg px-1.5 text-[12px] text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
        >
          {always}
        </button>
        <span className="flex-1" />
        <button
          type="button"
          onClick={() => void onDecide('reject_once')}
          className="h-7 rounded-lg border border-border bg-background px-3 text-[12.5px] hover:bg-accent"
        >
          Not now
        </button>
        <button
          type="button"
          onClick={() => void onDecide('allow_once')}
          className="h-7 rounded-lg bg-primary px-3.5 font-medium text-[12.5px] text-primary-foreground hover:opacity-90"
        >
          Allow
        </button>
      </div>
    </div>
  )
}
