import { IconCheck, IconCopy } from '@tabler/icons-react'
import { useState } from 'react'
import type { CopyLineProps } from './lib'

/** One line to paste somewhere else, and the button that copies it. */
export function CopyLine({ label, value, isSecret }: CopyLineProps) {
  const [isCopied, setIsCopied] = useState(false)
  const copy = () =>
    void navigator.clipboard.writeText(value).then(() => {
      setIsCopied(true)
      setTimeout(() => setIsCopied(false), 1500)
    })

  return (
    <div className="grid gap-1.5">
      <span className="font-medium text-[12.5px] text-muted-foreground">{label}</span>
      <div className="flex items-start gap-2 rounded-[10px] border border-border bg-background py-2 pr-1.5 pl-3">
        <code className="min-w-0 flex-1 break-all font-mono text-[12.5px] leading-relaxed">
          {isSecret && isCopied ? '•••• copied' : value}
        </code>
        <button
          type="button"
          onClick={copy}
          aria-label={`Copy ${label.toLowerCase()}`}
          className="grid size-7 shrink-0 place-items-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground"
        >
          {isCopied ? <IconCheck className="size-4" /> : <IconCopy className="size-4" />}
        </button>
      </div>
    </div>
  )
}
