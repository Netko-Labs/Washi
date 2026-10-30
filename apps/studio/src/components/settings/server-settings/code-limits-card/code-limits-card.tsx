import { CODE_LIMITS } from '@washi/domain'
import { NumberRow, SettingsCard } from '../../shared/card'
import { type CodeLimitsCardProps, changedLine, LIMIT_ROWS } from '../lib'

/** What page code, automations, formulas and uploads may spend, for every workspace (D118). */
export function CodeLimitsCard({ limits, lastChange, onSave }: CodeLimitsCardProps) {
  const changed = changedLine(lastChange)

  return (
    <SettingsCard
      title="Code limits"
      desc="Higher limits let pages, automations and uploads do more — and let a heavy one slow its readers or this server."
    >
      {LIMIT_ROWS.map((row) => (
        <NumberRow
          key={`${row.limit}:${limits[row.limit]}`}
          label={`${row.label} (${row.unit})`}
          hint={`Default ${CODE_LIMITS[row.limit]} ${row.unit}`}
          value={limits[row.limit]}
          integer
          onSave={(value) => onSave({ ...limits, [row.limit]: value })}
        />
      ))}
      {changed && (
        <p className="border-border border-t px-5 py-3 text-[12px] text-muted-foreground">
          {changed}
        </p>
      )}
    </SettingsCard>
  )
}
