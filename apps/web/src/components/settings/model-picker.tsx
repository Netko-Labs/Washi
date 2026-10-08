import { useMemo, useState } from 'react'
import type { ModelOption } from '@/lib/types'

/**
 * 317 models is not a dropdown. Filter by provider, then search — and show the
 * price, because the daily cap is denominated in it.
 */
export function ModelPicker({
  models,
  provider,
  value,
  onChange,
}: {
  models: ModelOption[]
  provider: string
  value: string | null
  onChange: (id: string) => void
}) {
  const [term, setTerm] = useState('')

  const shown = useMemo(() => {
    const needle = term.trim().toLowerCase()
    return models
      .filter((model) => model.provider === provider)
      .filter((model) => !needle || `${model.name} ${model.id}`.toLowerCase().includes(needle))
      .slice(0, 60)
  }, [models, provider, term])

  return (
    <div className="grid gap-2">
      <input
        value={term}
        onChange={(event) => setTerm(event.target.value)}
        placeholder={`Search ${models.filter((m) => m.provider === provider).length} models…`}
        className="h-11 rounded-xl border border-border bg-card px-3 text-[14px] outline-none focus-visible:border-primary"
      />
      <ul className="max-h-64 overflow-y-auto rounded-xl border border-border">
        {shown.map((model) => (
          <li key={model.id}>
            <button
              type="button"
              onClick={() => onChange(model.id)}
              aria-current={model.id === value ? 'true' : undefined}
              className={`flex w-full items-center gap-3 px-3 py-2.5 text-left ${
                model.id === value ? 'bg-accent' : 'hover:bg-accent/50'
              }`}
            >
              <span className="min-w-0 flex-1">
                <span className="block truncate font-bold text-[13.5px]">{model.name}</span>
                <span className="block truncate font-mono text-[11px] text-muted-foreground">
                  {model.id}
                </span>
              </span>
              <span className="shrink-0 text-right text-[11px] text-muted-foreground">
                {model.inputPerMTok == null ? (
                  // No published price means the dollar cap cannot see it — the
                  // turn cap is what bounds this one.
                  <span className="text-amber-700">unpriced</span>
                ) : (
                  <>
                    ${model.inputPerMTok}/${model.outputPerMTok}
                    <span className="block">per MTok</span>
                  </>
                )}
              </span>
            </button>
          </li>
        ))}
        {shown.length === 0 && (
          <li className="px-3 py-4 text-[13px] text-muted-foreground">
            {models.length === 0 ? 'Loading models…' : 'Nothing matches that.'}
          </li>
        )}
      </ul>
    </div>
  )
}
