import { useState } from 'react'
import { clampInt, clampMoney, type NumberRowProps } from '../../lib'
import { SettingRow } from './setting-row'

/** A number that saves on Enter or blur, and says nothing while it is unchanged. */
export function NumberRow({ label, hint, value, prefix, integer, onSave }: NumberRowProps) {
  const [draft, setDraft] = useState(String(value))
  const parsed = integer ? clampInt(draft) : clampMoney(draft)
  const changed = parsed !== null && parsed !== value

  const commit = () => {
    if (changed && parsed !== null) void onSave(parsed)
    else setDraft(String(value))
  }

  return (
    <SettingRow label={label} hint={hint}>
      <label className="flex h-[34px] items-center gap-1.5 rounded-[10px] border border-border bg-background px-2.5 font-mono text-[13px] focus-within:border-primary">
        {prefix && <span className="text-muted-foreground">{prefix}</span>}
        <input
          value={draft}
          inputMode={integer ? 'numeric' : 'decimal'}
          aria-label={label}
          onChange={(event) => setDraft(event.target.value)}
          onBlur={commit}
          onKeyDown={(event) => {
            if (event.key === 'Enter') event.currentTarget.blur()
          }}
          className="w-16 bg-transparent text-right outline-none"
        />
      </label>
    </SettingRow>
  )
}
