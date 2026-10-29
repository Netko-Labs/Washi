import { AgentMascot, usd } from '@washi/ui'
import { RESUME_BY_OPTIONS, type UsageCardProps } from '../lib'
import { NumberRow, Segmented, SettingRow, SettingsCard } from '../shared/card'
import { Gauge } from './gauge'

/** The daily stop as one card: two gauges, the paused strip, and the settings beside them. */
export function UsageCard({
  spend,
  settings,
  onDailyCap,
  onTurnCap,
  onResumeBy,
  onPause,
  onResume,
}: UsageCardProps) {
  const left = Math.max(0, spend.turnCap - spend.turns)

  return (
    <SettingsCard
      title="Usage and the daily stop"
      desc="A safety stop, not a quota. Washi pauses until tomorrow, or until someone resumes it."
      tag={spend.paused ? { label: 'Paused', tone: 'off' } : { label: 'Running', tone: 'ok' }}
    >
      <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,220px),1fr))] gap-5 px-4 py-4">
        <Gauge
          tone="spend"
          value={spend.costUsd}
          max={spend.capUsd}
          big={usd(spend.costUsd)}
          of={`of $${spend.capUsd} today`}
          left={
            spend.savedUsd > 0
              ? `metered · saved ${usd(spend.savedUsd)} on a plan`
              : 'metered dollars'
          }
          right={`resets at midnight · ${settings.zone}`}
        />
        <Gauge
          tone="turns"
          value={spend.turns}
          max={spend.turnCap}
          big={String(spend.turns)}
          of={`of ${spend.turnCap} turns`}
          left="every turn counts, plan or key"
          right={`${left} left`}
        />
      </div>
      {spend.paused && (
        <div className="mx-4 mb-4 flex items-center gap-3 rounded-xl border border-[#f5d28a] bg-[#fdf3dc] px-3.5 py-3 dark:border-[#6b4a0a] dark:bg-[#3d2f12]">
          <AgentMascot state="resting" size={28} />
          <div className="min-w-0 flex-1">
            <div className="font-semibold text-[13.5px] text-[#6b4a0a] dark:text-[#f1d59a]">
              Washi is paused.
            </div>
            <div className="text-[12.5px] text-[#7a5a12] leading-snug dark:text-[#e4c98a]">
              Resume grants a full day of headroom from now; raising the stop does the same.
            </div>
          </div>
          <button
            type="button"
            onClick={() => void onResume()}
            className="h-9 shrink-0 rounded-xl bg-[#6b4a0a] px-3.5 font-semibold text-[13px] text-white"
          >
            Resume
          </button>
        </div>
      )}
      <NumberRow
        key={`cap-${spend.capUsd}`}
        label="Daily stop"
        hint="Metered dollars a day before Washi pauses"
        value={spend.capUsd}
        prefix="$"
        onSave={onDailyCap}
      />
      <NumberRow
        key={`turns-${spend.turnCap}`}
        label="Turn cap"
        hint="The backstop for models with no price"
        value={spend.turnCap}
        integer
        onSave={onTurnCap}
      />
      <SettingRow label="Day resets at" hint="Midnight where the server runs">
        <span className="text-[13px] text-muted-foreground">{settings.zone}</span>
      </SettingRow>
      <SettingRow label="Who can resume" hint="Owners only, or anyone on the team">
        <Segmented
          value={settings.resumeBy}
          options={RESUME_BY_OPTIONS}
          onChange={(next) => void onResumeBy(next)}
        />
      </SettingRow>
      {!spend.paused && (
        <SettingRow label="Pause Washi now" hint="Until someone resumes it">
          <button
            type="button"
            onClick={() => void onPause()}
            className="h-[30px] rounded-lg border border-border bg-background px-3 text-[12.5px] hover:bg-accent"
          >
            Pause
          </button>
        </SettingRow>
      )}
    </SettingsCard>
  )
}
