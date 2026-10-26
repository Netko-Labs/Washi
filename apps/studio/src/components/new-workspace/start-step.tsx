import { IconCheck } from '@tabler/icons-react'
import { useState } from 'react'
import { STARTERS, type Starter, type StartStepProps } from './lib'

export function StartStep({ busy, error, onStart }: StartStepProps) {
  const [starter, setStarter] = useState<Starter>('team')

  return (
    <div>
      <h1 className="font-semibold text-[26px] tracking-[-0.02em]">How do you want to start?</h1>
      <p className="mt-2 max-w-md text-[14px] text-muted-foreground leading-relaxed">
        Both are ordinary pages and tables. Rename, move or delete anything later.
      </p>

      <div role="radiogroup" aria-label="Start with" className="mt-8 grid gap-3 sm:grid-cols-2">
        {STARTERS.map((entry) => (
          <button
            key={entry.id}
            type="button"
            role="radio"
            aria-checked={starter === entry.id}
            onClick={() => setStarter(entry.id)}
            className={`grid content-start gap-2 rounded-2xl border bg-card p-4 text-left ${
              starter === entry.id ? 'border-primary ring-1 ring-primary' : 'border-border'
            }`}
          >
            <span className="flex items-center justify-between font-semibold text-[15px]">
              {entry.title}
              <span
                className={`grid size-5 place-items-center rounded-full border ${
                  starter === entry.id
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-border'
                }`}
              >
                {starter === entry.id && <IconCheck className="size-3" />}
              </span>
            </span>
            <span className="text-[13px] text-muted-foreground leading-relaxed">{entry.text}</span>
            <ul className="mt-1 grid gap-1">
              {entry.includes.map((item) => (
                <li key={item} className="flex gap-2 text-[12.5px]">
                  <span className="text-primary">·</span>
                  {item}
                </li>
              ))}
            </ul>
          </button>
        ))}
      </div>

      {error && <p className="mt-4 text-[13px] text-destructive">{error}</p>}

      <button
        type="button"
        disabled={busy}
        onClick={() => onStart(starter)}
        className="mt-8 h-11 rounded-xl bg-primary px-6 font-semibold text-[14px] text-primary-foreground disabled:opacity-50"
      >
        {busy ? 'Setting it up…' : 'Continue'}
      </button>
    </div>
  )
}
