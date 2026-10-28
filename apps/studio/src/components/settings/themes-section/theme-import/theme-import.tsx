import { IconFileImport } from '@tabler/icons-react'
import { fillDraft, readTheme, THEMES } from '@washi/paper/registry'
import { useState } from 'react'
import { Dialog } from '@/components/shared/dialog'
import type { ThemeImportProps } from '../lib'

/** Paste shadcn / tweakcn CSS or drop a Washi theme file; it opens in the editor to finish. */
export function ThemeImport({ onRead, onClose }: ThemeImportProps) {
  const [text, setText] = useState('')
  const [error, setError] = useState<string | null>(null)
  const read = (source: string) => {
    try {
      const draft = readTheme(source)
      const { light, dark, filled } = fillDraft(draft, THEMES.washi)
      onRead({ id: null, name: draft.name ?? '', light, dark, filled })
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'That is not a theme.')
    }
  }

  return (
    <Dialog label="Import a theme" onClose={onClose} width={560}>
      <div>
        <h2 className="font-semibold text-[15px]">Import a theme</h2>
        <p className="mt-0.5 text-[12.5px] text-muted-foreground">
          Paste the CSS shadcn or tweakcn gives you — <code>:root</code> and <code>.dark</code> — or
          a Washi theme file someone exported.
        </p>
      </div>
      <textarea
        ref={(node) => node?.focus()}
        value={text}
        onChange={(event) => {
          setText(event.target.value)
          setError(null)
        }}
        rows={10}
        spellCheck={false}
        placeholder={
          ':root {\n  --background: oklch(1 0 0);\n  --foreground: oklch(0.145 0 0);\n  …\n}'
        }
        aria-label="Theme CSS or JSON"
        className="w-full resize-none rounded-xl border border-border bg-background p-3 font-mono text-[12px] outline-none focus-visible:border-primary"
      />
      {error && <p className="text-[12.5px] text-destructive">{error}</p>}
      <div className="flex items-center gap-2">
        <label className="flex h-9 cursor-pointer items-center gap-2 rounded-xl border border-border px-3 text-[13px] hover:bg-accent">
          <IconFileImport className="size-4 text-muted-foreground" />
          Open a file
          <input
            type="file"
            accept=".json,.css,text/css,application/json"
            className="sr-only"
            onChange={(event) => void event.target.files?.[0]?.text().then(read)}
          />
        </label>
        <button
          type="button"
          onClick={onClose}
          className="ml-auto h-9 rounded-xl px-4 text-[13px] text-muted-foreground hover:bg-accent"
        >
          Cancel
        </button>
        <button
          type="button"
          disabled={!text.trim()}
          onClick={() => read(text)}
          className="h-9 rounded-xl bg-foreground px-4 font-semibold text-[13px] text-background disabled:opacity-40"
        >
          Read it
        </button>
      </div>
    </Dialog>
  )
}
