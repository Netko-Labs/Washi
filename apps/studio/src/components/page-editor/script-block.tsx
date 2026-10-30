import { IconCode, IconEye } from '@tabler/icons-react'
import { useState } from 'react'
import type { ScriptBlockProps } from './lib'
import { LockedBlock } from './locked-block'
import { ScriptCode } from './script-code'
import { TerminalFiles } from './terminal-files'

/** A script while the page is open for typing: its code, or what it draws, one press apart. */
export function ScriptBlock({ block, rootProps }: ScriptBlockProps) {
  const [isCode, setCode] = useState(false)
  return (
    <div className="grid gap-1.5">
      <div className="flex items-start justify-end gap-2">
        {block.node.name === 'Terminal' && <TerminalFiles block={block} />}
        <button
          type="button"
          onClick={() => setCode(!isCode)}
          aria-pressed={isCode}
          className="flex h-7 items-center gap-1.5 rounded-lg px-2 font-sans text-[12px] text-muted-foreground hover:bg-black/5 dark:hover:bg-white/10"
        >
          {isCode ? <IconEye className="size-3.5" /> : <IconCode className="size-3.5" />}
          {isCode ? 'Preview' : 'Code'}
        </button>
      </div>
      {isCode ? <ScriptCode block={block} /> : <LockedBlock block={block} rootProps={rootProps} />}
    </div>
  )
}
