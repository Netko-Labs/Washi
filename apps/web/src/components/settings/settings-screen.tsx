import { IconX } from '@tabler/icons-react'
import { formatUsd } from '@/components/agent'
import { DailyStop } from './daily-stop'
import { KeyForm } from './key-form'
import { type SettingsScreenProps, useAgentSettings } from './lib'

export function SettingsScreen({ onClose }: SettingsScreenProps) {
  const settings = useAgentSettings()
  const { key, spend, error, loading } = settings

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
          Washi runs on your server with one model key for the whole workspace. Nobody on the team
          needs their own.
        </p>

        {key && (
          <p className="mt-4 rounded-xl bg-accent px-3 py-2.5 font-mono text-[12.5px]">
            {key.provider} · ••••{key.last4}
            {key.model && ` · ${key.model}`}
          </p>
        )}

        <div className="mt-5">
          <KeyForm
            models={settings.models}
            catalogueSource={settings.catalogueSource}
            hasKey={Boolean(key)}
            onSave={settings.save}
          />
        </div>
      </section>

      {spend && (
        <section className="mt-10 border-border border-t pt-8">
          <h2 className="font-bold text-[15px]">Daily stop</h2>
          <p className="mt-1 text-[13.5px] text-muted-foreground leading-relaxed">
            At the daily stop Washi pauses until tomorrow. Anyone on the team can resume it. A
            safety stop, not a quota — Washi is open source and there is no plan to buy.
          </p>
          <div className="mt-4">
            <DailyStop key={spend.capUsd} capUsd={spend.capUsd} onSave={settings.setDailyCap} />
          </div>
          <dl className="mt-5 grid grid-cols-3 gap-3">
            <Stat label="Today" value={formatUsd(spend.costUsd)} />
            <Stat label="Turns" value={`${spend.turns} / ${spend.turnCap}`} />
            <Stat label="Stop" value={`$${spend.capUsd}`} />
          </dl>
          {spend.paused && (
            <div className="mt-4 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3">
              <p className="font-bold text-[13.5px] text-amber-900">Washi is paused.</p>
              <p className="mt-1 text-[13px] text-amber-800 leading-relaxed">
                It reached today's stop. Resuming gives it one more day's worth of headroom.
              </p>
              <button
                type="button"
                onClick={() => void settings.resume()}
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
      <dd className="mt-0.5 font-mono font-bold text-[16px]">{value}</dd>
    </div>
  )
}
