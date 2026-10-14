import { IconCheck, IconLink } from '@tabler/icons-react'
import { useState } from 'react'

/** Every page has an address now; sharing it is copying it. Access is still membership. */
export function CopyLinkButton() {
  const [copied, setCopied] = useState(false)

  const copy = async () => {
    await navigator.clipboard.writeText(window.location.href)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <button
      type="button"
      onClick={() => void copy()}
      title="Copy a link to this page — only workspace members can open it"
      className="flex h-8 items-center gap-1.5 rounded-lg border border-border bg-background px-2.5 font-medium text-[12.5px] hover:bg-accent"
    >
      {copied ? <IconCheck className="size-3.5 text-primary" /> : <IconLink className="size-3.5" />}
      <span className="hidden sm:inline">{copied ? 'Copied' : 'Copy link'}</span>
    </button>
  )
}
