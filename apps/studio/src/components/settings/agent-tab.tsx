import { usd as formatUsd } from '@washi/ui'
import { DailyStop } from './daily-stop'
import { KeyForm } from './key-form'
import { APPROVAL_MODE_OPTIONS, useAgentSettings } from './lib'
import { SearchKeyForm } from './search-key-form'

export function AgentTab() {
  const settings = useAgentSettings()
  const { key, searchKey, approvalMode, spend, error, loading } = settings

  return (
    <div>
      {loading && <p className="mb-4 text-[13px] text-muted-foreground">Loading…</p>}

      <section>
        <h2 className="font-semibold text-[15px]">Agent key</h2>
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

      <section className="mt-10 border-border border-t pt-8">
        <h2 className="font-semibold text-[15px]">Web search</h2>
        <p className="mt-1 text-[13.5px] text-muted-foreground leading-relaxed">
          With an Exa key Washi can search the web. Every search still stops at the desk until
          someone allows it always.
        </p>
        {searchKey && (
          <p className="mt-4 rounded-xl bg-accent px-3 py-2.5 font-mono text-[12.5px]">
            exa · ••••{searchKey.last4}
          </p>
        )}
        <div className="mt-5">
          <SearchKeyForm hasKey={Boolean(searchKey)} onSave={settings.saveSearchKey} />
        </div>
      </section>

      <section className="mt-10 border-border border-t pt-8">
        <h2 className="font-semibold text-[15px]">Approvals</h2>
        <p className="mt-1 text-[13.5px] text-muted-foreground leading-relaxed">
          Reads pass and page edits land either way. This is about what leaves the server.
        </p>
        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          {APPROVAL_MODE_OPTIONS.map((option) => (
            <button
              key={option.id}
              type="button"
              aria-pressed={approvalMode === option.id}
              onClick={() => void settings.setApprovalMode(option.id)}
              className={`rounded-xl border px-4 py-3 text-left ${
                approvalMode === option.id ? 'border-primary bg-accent' : 'border-border'
              }`}
            >
              <span className="block font-semibold text-[13.5px]">{option.label}</span>
              <span className="mt-0.5 block text-[12.5px] text-muted-foreground leading-relaxed">
                {option.desc}
              </span>
            </button>
          ))}
        </div>
      </section>

      {spend && (
        <section className="mt-10 border-border border-t pt-8">
          <h2 className="font-semibold text-[15px]">Daily stop</h2>
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
              <p className="font-semibold text-[13.5px] text-amber-900">Washi is paused.</p>
              <p className="mt-1 text-[13px] text-amber-800 leading-relaxed">
                It reached today's stop. Resuming gives it one more day's worth of headroom.
              </p>
              <button
                type="button"
                onClick={() => void settings.resume()}
                className="mt-3 h-11 rounded-xl bg-amber-900 px-4 font-semibold text-[13.5px] text-white"
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
      <dd className="mt-0.5 font-mono font-semibold text-[16px]">{value}</dd>
    </div>
  )
}
