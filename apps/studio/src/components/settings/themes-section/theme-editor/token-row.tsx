import { toHex } from '@washi/paper/registry'
import { useState } from 'react'
import type { TokenRowProps } from '../lib'

/** A swatch that opens the system picker, and the hex beside it for pasting. */
export function TokenRow({ label, value, onChange }: TokenRowProps) {
  const [typed, setTyped] = useState<string | null>(null)
  return (
    <label className="flex items-center gap-2.5 py-1">
      <span className="relative size-7 shrink-0 overflow-hidden rounded-lg border border-border">
        <span className="absolute inset-0" style={{ background: value }} />
        <input
          type="color"
          value={value.toLowerCase()}
          onChange={(event) => onChange(event.target.value.toUpperCase())}
          className="absolute inset-0 size-full cursor-pointer opacity-0"
          aria-label={label}
        />
      </span>
      <span className="flex-1 text-[13px]">{label}</span>
      <input
        value={typed ?? value}
        onChange={(event) => {
          setTyped(event.target.value)
          const color = toHex(event.target.value)
          if (color) onChange(color)
        }}
        onBlur={() => setTyped(null)}
        spellCheck={false}
        aria-label={`${label} colour`}
        className="h-7 w-[92px] rounded-lg border border-border bg-background px-2 font-mono text-[12px] uppercase outline-none focus-visible:border-primary"
      />
    </label>
  )
}
