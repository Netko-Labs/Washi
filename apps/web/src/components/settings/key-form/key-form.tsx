import type { KeyFormProps } from '../lib'
import { PROVIDERS, useKeyForm } from '../lib'
import { ModelPicker } from '../model-picker'

/** Provider, key, model. The key goes in and only its last four ever come back out. */
export function KeyForm({ models, catalogueSource, hasKey, onSave, extra }: KeyFormProps) {
  const form = useKeyForm(onSave)

  return (
    <div>
      <div className="flex gap-2">
        {PROVIDERS.map((entry) => (
          <button
            key={entry.id}
            type="button"
            onClick={() => form.pickProvider(entry.id)}
            className={`h-11 flex-1 rounded-xl border text-[13.5px] font-bold ${
              form.provider === entry.id ? 'border-primary bg-accent' : 'border-border'
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
          value={form.secret}
          autoComplete="off"
          onChange={(event) => form.setSecret(event.target.value)}
          placeholder={PROVIDERS.find((p) => p.id === form.provider)?.hint}
          className="h-11 rounded-xl border border-border bg-card px-3 font-mono text-[13px] outline-none focus-visible:border-primary"
        />
        <span className="text-[12px] text-muted-foreground">
          Encrypted on your server. You will see the last four and never the rest.
        </span>
      </label>

      <div className="mt-4 grid gap-1.5">
        <span className="font-bold text-[13px]">
          Model{' '}
          <span className="font-normal text-muted-foreground">
            — optional; a sensible one is chosen otherwise
          </span>
        </span>
        <ModelPicker
          models={models}
          provider={form.provider}
          value={form.model}
          onChange={form.setModel}
        />
        {catalogueSource === 'fallback' && (
          <p className="text-[12px] text-amber-700">
            models.dev is unreachable — showing a bundled list.
          </p>
        )}
      </div>

      {extra}

      <button
        type="button"
        onClick={() => void form.submit()}
        disabled={form.busy || form.secret.length < 8}
        className="mt-5 h-11 rounded-xl bg-primary px-5 font-bold text-[14px] text-primary-foreground disabled:opacity-50"
      >
        {hasKey ? 'Replace key' : 'Save key'}
      </button>
    </div>
  )
}
