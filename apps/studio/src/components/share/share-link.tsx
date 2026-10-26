import { IconCheck, IconCopy, IconEyeOff } from '@tabler/icons-react'
import { useState } from 'react'
import { hiddenInWords, type ShareLinkProps } from './lib'

export function ShareLink({ url, hidden }: ShareLinkProps) {
  const [copied, setCopied] = useState(false)
  const leftOut = hiddenInWords(hidden)

  return (
    <div className="grid gap-2">
      <div className="flex gap-1.5">
        <input
          readOnly
          value={url}
          aria-label="Read-only link"
          onFocus={(event) => event.currentTarget.select()}
          className="h-9 min-w-0 flex-1 rounded-lg border border-border bg-background px-2.5 font-mono text-[11.5px] outline-none"
        />
        <button
          type="button"
          onClick={() =>
            void navigator.clipboard.writeText(url).then(() => {
              setCopied(true)
              setTimeout(() => setCopied(false), 1500)
            })
          }
          className="flex h-9 shrink-0 items-center gap-1.5 rounded-lg bg-primary px-3 font-semibold text-[12.5px] text-primary-foreground"
        >
          {copied ? <IconCheck className="size-3.5" /> : <IconCopy className="size-3.5" />}
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>
      <p className="flex gap-2 rounded-lg bg-muted px-2.5 py-2 text-[12px] leading-snug">
        <IconEyeOff className="mt-px size-3.5 shrink-0 text-muted-foreground" />
        {leftOut ? (
          <span>
            <b className="font-semibold">Hidden from the link:</b> {leftOut}
          </span>
        ) : (
          <span className="text-muted-foreground">
            Nothing is hidden. Wrap a block in Redact, or redact a view's columns, to keep it in.
          </span>
        )}
      </p>
    </div>
  )
}
