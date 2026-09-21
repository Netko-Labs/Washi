import { IconX } from '@tabler/icons-react'
import { useState } from 'react'
import { useAgentSettings } from './lib'
import { ModelPicker } from './model-picker'

const PROVIDERS = [
  { id: 'anthropic', label: 'Anthropic', hint: 'sk-ant-…' },
  { id: 'openrouter', label: 'OpenRouter', hint: 'sk-or-…' },
] as const

export function SettingsScreen({ onClose }: { onClose: () => void }) {
  const { key, spend, models, catalogueSource, error, loading, save, resume } = useAgentSettings()
  const [provider, setProvider] = useState<string>('anthropic')
  const [model, setModel] = useState<string | null>(null)
  const [secret, setSecret] = useState('')
  const [busy, setBusy] = useState(false)

  const submit = async () => {
    setBusy(true)
    if (await save({ key: secret, provider, model })) setSecret('')
    setBusy(false)
  }

  return (
    <div className="mx-auto max-w-2xl px-6 py-8">
      <header className="flex items-center gap-3">
        <h1 className="flex-1 font-black text-2xl tracking-tight">Settings</h1>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close settings"
          className="grid size-11 place-items-center rounded-lg hover:bg-accent"
        >
          <IconX className="size-5" />
        </button>
      </header>

      {loading && <p className="mt-8 text-[14px] text-muted-foreground">Loading…</p>}

      <section className="mt-8">
        <h2 className="font-bold text-[15px]">Agent key</h2>
        <p className="mt-1 text-[13.5px] text-muted-foreground leading-relaxed">
          The agent runs on this workspace's own key. It is encrypted before it is stored and never
          sent back to a browser — you will only ever see the last four characters.
        </p>

        {key && (
          <p className="mt-4 rounded-xl bg-accent px-3 py-2.5 text-[13px]">
            <strong>{key.provider}</strong> · ••••{key.last4}
            {key.model && <span className="font-mono"> · {key.model}</span>}
          </p>
        )}

        <div className="mt-5 flex gap-2">
          {PROVIDERS.map((entry) => (
            <button
              key={entry.id}
              type="button"
              onClick={() => {
                setProvider(entry.id)
                setModel(null)
              }}
              className={`h-11 flex-1 rounded-xl border text-[13.5px] font-bold ${
                provider === entry.id ? 'border-primary bg-accent' : 'border-border'
              }`}
            >
              {entry.label}
            </button>
          ))}
        </div>

        <label className="mt-4 grid gap-1.5">
          <span className="font-bold text-[13px]">API key</span>
          <input
            type="password"
            value={secret}
            autoComplete="off"
            onChange={(event) => setSecret(event.target.value)}
            placeholder={PROVIDERS.find((p) => p.id === provider)?.hint}
            className="h-11 rounded-xl border border-border bg-card px-3 font-mono text-[13px] outline-none focus-visible:border-primary"
          />
        </label>

        <div className="mt-4 grid gap-1.5">
          <span className="font-bold text-[13px]">
            Model{' '}
            <span className="font-normal text-muted-foreground">
              — optional; a sensible one is chosen otherwise
            </span>
          </span>
          <ModelPicker models={models} provider={provider} value={model} onChange={setModel} />
          {catalogueSource === 'fallback' && (
            <p className="text-[12px] text-amber-700">
              models.dev is unreachable — showing a bundled list.
            </p>
          )}
        </div>

        <button
          type="button"
          onClick={() => void submit()}
          disabled={busy || secret.length < 8}
          className="mt-5 h-11 rounded-xl bg-primary px-5 font-bold text-[14px] text-primary-foreground disabled:opacity-50"
        >
          {key ? 'Replace key' : 'Save key'}
        </button>
      </section>

      {spend && (
        <section className="mt-10 border-border border-t pt-8">
          <h2 className="font-bold text-[15px]">Today</h2>
          <p className="mt-1 text-[13.5px] text-muted-foreground leading-relaxed">
            A safety stop, not a quota. Washi is open source and there is no plan to buy.
          </p>
          <dl className="mt-4 grid grid-cols-3 gap-3">
            <Stat label="Spent" value={`$${spend.costUsd.toFixed(2)}`} />
            <Stat label="Cap" value={`$${spend.capUsd}`} />
            <Stat label="Turns" value={String(spend.turns)} />
          </dl>
          {spend.paused && (
            <div className="mt-4 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3">
              <p className="font-bold text-[13.5px] text-amber-900">The agent is paused.</p>
              <p className="mt-1 text-[13px] text-amber-800 leading-relaxed">
                It reached today's cap. Resuming gives it one more cap of headroom.
              </p>
              <button
                type="button"
                onClick={() => void resume()}
                className="mt-3 h-11 rounded-xl bg-amber-900 px-4 font-bold text-[13.5px] text-white"
              >
                Resume
              </button>
            </div>
          )}
        </section>
      )}

      {error && <p className="mt-6 text-[13px] text-destructive">{error}</p>}
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border px-3 py-2.5">
      <dt className="text-[11px] text-muted-foreground uppercase tracking-wide">{label}</dt>
      <dd className="mt-0.5 font-black text-[17px]">{value}</dd>
    </div>
  )
}
