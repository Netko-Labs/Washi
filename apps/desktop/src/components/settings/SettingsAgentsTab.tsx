import {
  AutoApproveRow,
  RowButton,
  SegmentedControl,
  SettingsCard,
  SettingsRow,
  usd,
} from '@washi/ui'
import { DailyStopInput } from './DailyStopInput'
import { type InferenceWire, LOCAL_MODEL_LABELS, PREFERENCE_LABELS, useAgentRuntime } from './lib'
import { RoutinesCard } from './RoutinesCard'

function cliLine(cli: InferenceWire['localCli']): string {
  if (!cli) return 'Not installed · claude.com/code'
  const version = cli.version ? `v${cli.version}` : 'installed'
  if (!cli.loggedIn) return `${version} · signed out — run \`claude\` and sign in`
  if (cli.authMethod !== 'claude.ai') return `${version} · Console login · billed per token`
  const plan = cli.plan ? `${cli.plan[0]?.toUpperCase()}${cli.plan.slice(1)} plan` : 'signed in'
  return `${version} · ${plan} · turns ride the plan you already pay for`
}

function InUse({ on }: { on: boolean }) {
  if (!on) return null
  return (
    <span className="flex h-5 flex-none items-center rounded-full bg-[#16a34a]/10 px-2 font-medium text-[#16a34a] text-[11px]">
      In use
    </span>
  )
}

/**
 * Who pays for Washi's thinking, and what it cost today. On this computer the
 * answer is usually your own Claude Code login: a plan you already pay for
 * beats a key that bills per token.
 */
export function SettingsAgentsTab() {
  const { inference, spend, error, prefer, pickLocalModel, setDailyCap, resume } = useAgentRuntime()
  if (!inference || !spend) {
    return <p className="text-muted-foreground">{error ?? 'Checking this computer…'}</p>
  }

  const active = PREFERENCE_LABELS.find((entry) => entry.value === inference.preference)
  const localModel = LOCAL_MODEL_LABELS.find((entry) => entry.value === inference.localModel)
  return (
    <div className="flex flex-col gap-[22px]">
      <AutoApproveRow />

      <SettingsCard>
        <SettingsRow title="Claude Code on this computer" sub={cliLine(inference.localCli)} mono>
          <InUse on={inference.active === 'local_cli'} />
        </SettingsRow>
        <SettingsRow
          title="API key"
          sub={
            inference.apiKey
              ? 'ANTHROPIC_API_KEY from this app’s environment · billed per token'
              : 'None in this app’s environment'
          }
          mono
        >
          <InUse on={inference.active === 'api_key'} />
        </SettingsRow>
        <SettingsRow
          title="Claude Code model"
          sub="Default lets Claude Code choose. Sonnet or Haiku stretch your plan's limits further."
          wrap
        >
          <SegmentedControl
            options={LOCAL_MODEL_LABELS.map((entry) => entry.label)}
            active={localModel?.label ?? 'Default'}
            onSelect={(label) => {
              const choice = LOCAL_MODEL_LABELS.find((entry) => entry.label === label)
              if (choice) void pickLocalModel(choice.value)
            }}
          />
        </SettingsRow>
        <SettingsRow title="Think with" sub="Auto uses Claude Code when it is signed in" wrap last>
          <SegmentedControl
            options={PREFERENCE_LABELS.map((entry) => entry.label)}
            active={active?.label ?? 'Auto'}
            onSelect={(label) => {
              const choice = PREFERENCE_LABELS.find((entry) => entry.label === label)
              if (choice) void prefer(choice.value)
            }}
          />
        </SettingsRow>
      </SettingsCard>

      {inference.missing && (
        <p className="rounded-[14px] border border-amber-300 bg-amber-50 px-[18px] py-3 text-[13px] text-amber-900 leading-relaxed">
          {inference.missing}
        </p>
      )}

      <SettingsCard>
        <SettingsRow
          title="Saved by your Claude plan"
          sub="Turns your plan covered. They never count toward the daily stop."
        >
          <span className="flex-none font-mono text-[13px]">{usd(spend.savedUsd)}</span>
        </SettingsRow>
        <SettingsRow
          title="Spent on API keys"
          sub={`${spend.turns} of ${spend.turnCap} turns today`}
          mono
        >
          <span className="flex-none font-mono text-[13px]">
            {usd(spend.costUsd)} of ${spend.capUsd}
          </span>
        </SettingsRow>
        <SettingsRow
          title="Daily stop"
          sub="At the stop Washi pauses until tomorrow, or until you resume it"
          last={!spend.paused}
        >
          <DailyStopInput key={spend.capUsd} capUsd={spend.capUsd} onSave={setDailyCap} />
        </SettingsRow>
        {spend.paused && (
          <SettingsRow title="Washi is paused" sub="Resuming grants one more day of headroom" last>
            <RowButton onClick={() => void resume()}>Resume</RowButton>
          </SettingsRow>
        )}
      </SettingsCard>

      <RoutinesCard />

      {error && <p className="text-[13px] text-destructive">{error}</p>}
    </div>
  )
}
