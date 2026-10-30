import { SAFEGUARDS } from '@washi/domain'
import { SettingsCard } from '../../shared/card'
import { changedLine, SAFEGUARD_COPY, type SafeguardsCardProps } from '../lib'

/** The guards an admin may lift for every workspace (D118): each off unless said, each logged. */
export function SafeguardsCard({ safeguards, log, onChange }: SafeguardsCardProps) {
  const lifted = SAFEGUARDS.filter((which) => safeguards[which]).length

  return (
    <SettingsCard
      title="Safeguards"
      desc="What keeps every workspace on this server safe by default. Lift one only if you mean it."
      tag={
        lifted > 0 ? { tone: 'off', label: `${lifted} lifted` } : { tone: 'ok', label: 'All on' }
      }
    >
      {SAFEGUARDS.map((which) => {
        const copy = SAFEGUARD_COPY[which]
        const isLifted = safeguards[which]
        const changed = changedLine(log.find((change) => change.which === which))
        return (
          <div
            key={which}
            className="flex flex-wrap items-center gap-x-4 gap-y-2 border-border border-t px-5 py-4 text-[13.5px] first:border-t-0"
          >
            <div className="min-w-0 flex-1">
              <div className="font-medium">{copy.label}</div>
              <p
                className={`mt-0.5 text-[12.5px] ${isLifted ? 'text-destructive' : 'text-muted-foreground'}`}
              >
                {copy.warning}
              </p>
              {changed && <p className="mt-0.5 text-[12px] text-muted-foreground">{changed}</p>}
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={isLifted}
              aria-label={copy.label}
              onClick={() => void onChange(which, !isLifted)}
              className="h-9 shrink-0 rounded-xl border border-border px-4 font-semibold text-[13px] hover:bg-accent"
            >
              {isLifted ? 'Turn the guard back on' : 'Lift'}
            </button>
          </div>
        )
      })}
    </SettingsCard>
  )
}
