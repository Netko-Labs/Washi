import { VaultIcon } from '@washi/ui'
import { useState } from 'react'
import type { NameStepProps } from './lib'

export function NameStep({ busy, error, onName }: NameStepProps) {
  const [name, setName] = useState('')
  const shown = name.trim() || 'Your workspace'

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault()
        if (name.trim() && !busy) onName(name.trim())
      }}
    >
      <h1 className="font-semibold text-[26px] tracking-[-0.02em]">Name your workspace</h1>
      <p className="mt-2 max-w-md text-[14px] text-muted-foreground leading-relaxed">
        A workspace holds its own pages, tables and people, in one file on this server. Your team's
        name works; you can change it in Settings.
      </p>

      <label className="mt-8 grid gap-1.5">
        <span className="font-semibold text-[13px]">Workspace name</span>
        <input
          ref={(node) => node?.focus()}
          value={name}
          maxLength={60}
          onChange={(event) => setName(event.target.value)}
          placeholder="Netko Labs"
          className="h-11 rounded-xl border border-border bg-card px-3 text-[15px] outline-none focus-visible:border-primary"
        />
      </label>

      <div className="mt-5 rounded-xl border border-border border-dashed p-3">
        <p className="mb-2 font-mono text-[11px] text-muted-foreground">In the switcher</p>
        <div className="flex items-center gap-2.5">
          <VaultIcon topic="plain" size={30} className="shrink-0" />
          <span className="min-w-0">
            <span className="block truncate font-medium text-[14px]">{shown}</span>
            <span className="block text-[12px] text-muted-foreground">Owner · you</span>
          </span>
        </div>
      </div>

      {error && <p className="mt-4 text-[13px] text-destructive">{error}</p>}

      <button
        type="submit"
        disabled={busy || !name.trim()}
        className="mt-8 h-11 rounded-xl bg-primary px-6 font-semibold text-[14px] text-primary-foreground disabled:opacity-50"
      >
        {busy ? 'Making it…' : 'Continue'}
      </button>
    </form>
  )
}
