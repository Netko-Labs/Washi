import { useState } from 'react'
import type { SearchKeyFormProps } from '../lib'

/** One Exa key for the workspace. Like the agent key: it goes in, its last four come back. */
export function SearchKeyForm({ hasKey, onSave }: SearchKeyFormProps) {
  const [secret, setSecret] = useState('')
  const [busy, setBusy] = useState(false)

  const submit = async () => {
    setBusy(true)
    if (await onSave(secret)) setSecret('')
    setBusy(false)
  }

  return (
    <div>
      <label className="grid gap-1.5">
        <span className="font-semibold text-[13px]">Exa API key</span>
        <input
          type="password"
          value={secret}
          autoComplete="off"
          onChange={(event) => setSecret(event.target.value)}
          placeholder="exa-…"
          className="h-11 rounded-xl border border-border bg-card px-3 font-mono text-[13px] outline-none focus-visible:border-primary"
        />
        <span className="text-[12px] text-muted-foreground">
          Encrypted on your server, like the agent key. Keys come from exa.ai.
        </span>
      </label>
      <button
        type="button"
        onClick={() => void submit()}
        disabled={busy || secret.length < 8}
        className="mt-4 h-11 rounded-xl bg-primary px-5 font-semibold text-[14px] text-primary-foreground disabled:opacity-50"
      >
        {hasKey ? 'Replace key' : 'Save key'}
      </button>
    </div>
  )
}
