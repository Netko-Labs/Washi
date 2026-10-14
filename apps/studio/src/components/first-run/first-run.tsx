import { IconCheck } from '@tabler/icons-react'
import { AgentMascot } from '@washi/ui'
import { useState } from 'react'
import { KeyForm, useAgentSettings } from '@/components/settings'
import { DEFAULT_DAILY_STOP_USD, type FirstRunProps, PROMISES } from './lib'

/** Step two of two. The workspace exists; this is what wakes Washi up inside it. */
export function FirstRun({ workspace, onDone, onSkip }: FirstRunProps) {
  const settings = useAgentSettings()
  const [capUsd, setCapUsd] = useState(String(DEFAULT_DAILY_STOP_USD))

  const saveAll = async (input: Parameters<typeof settings.save>[0]) => {
    if (!(await settings.save(input))) return false
    const cap = Number(capUsd)
    if (Number.isFinite(cap) && cap > 0 && cap !== DEFAULT_DAILY_STOP_USD) {
      await settings.setDailyCap(cap)
    }
    onDone()
    return true
  }

  return (
    <div className="min-h-0 flex-1 overflow-y-auto">
      <div className="mx-auto grid max-w-4xl gap-10 px-6 py-10 lg:grid-cols-[1fr_260px]">
        <section>
          <ol className="flex flex-wrap gap-x-5 gap-y-2 text-[13px]">
            <li className="flex items-center gap-1.5 text-muted-foreground">
              <IconCheck className="size-3.5" /> Name it · {workspace.name}
            </li>
            <li className="flex items-center gap-1.5 font-semibold">
              <span className="grid size-4 place-items-center rounded-full bg-primary font-mono text-[10px] text-primary-foreground">
                2
              </span>
              Give Washi a key
            </li>
          </ol>

          <p className="mt-8 font-mono text-[12px] text-muted-foreground">Step 2 of 2</p>
          <h1 className="mt-1 font-semibold text-[26px] tracking-[-0.02em]">Give Washi a key</h1>
          <p className="mt-2 max-w-xl text-[14px] text-muted-foreground leading-relaxed">
            Washi runs on your server with one model key for the whole workspace. Nobody on the team
            needs their own.
          </p>

          <div className="mt-6">
            <KeyForm
              models={settings.models}
              catalogueSource={settings.catalogueSource}
              hasKey={false}
              onSave={saveAll}
              extra={
                <label className="mt-6 grid max-w-sm gap-1.5">
                  <span className="font-semibold text-[13px]">Daily stop</span>
                  <span className="flex items-center gap-2">
                    <span className="font-mono text-[14px]">$</span>
                    <input
                      inputMode="decimal"
                      value={capUsd}
                      onChange={(event) => setCapUsd(event.target.value)}
                      className="h-11 w-24 rounded-xl border border-border bg-card px-3 font-mono text-[14px] outline-none focus-visible:border-primary"
                    />
                    <span className="text-[13.5px] text-muted-foreground">a day</span>
                  </span>
                  <span className="text-[12px] text-muted-foreground leading-relaxed">
                    At the daily stop Washi pauses until tomorrow. Anyone on the team can resume it.
                  </span>
                </label>
              }
            />
          </div>

          {settings.error && <p className="mt-4 text-[13px] text-destructive">{settings.error}</p>}

          <button
            type="button"
            onClick={onSkip}
            className="mt-8 h-11 text-[13.5px] text-muted-foreground underline underline-offset-4"
          >
            Skip · Washi stays asleep
          </button>
        </section>

        <aside className="self-start rounded-2xl border border-border bg-card p-5">
          <AgentMascot state="resting" size={56} className="mb-4" />
          <p className="text-[13.5px] leading-relaxed">
            Once I have a key, I'll design the pages you ask for. I ask before anything leaves your
            server.
          </p>
          <ul className="mt-4 grid gap-2.5">
            {PROMISES.map((promise) => (
              <li key={promise.mark} className="flex gap-2.5 text-[12.5px] leading-relaxed">
                <span className="font-mono text-primary">{promise.mark}</span>
                <span className="text-muted-foreground">{promise.text}</span>
              </li>
            ))}
          </ul>
        </aside>
      </div>
    </div>
  )
}
