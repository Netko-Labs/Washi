import { APPROVAL_MODE_OPTIONS } from '../../lib'
import { NumberRow, Segmented, SettingRow, SettingsCard } from '../../shared/card'
import { WASHI_DEFAULTS, type WorkspaceDefaultsCardProps } from '../lib'

/** What a workspace made from now on starts with, written into its own file once. */
export function WorkspaceDefaultsCard({ defaults, onSave }: WorkspaceDefaultsCardProps) {
  return (
    <SettingsCard
      title="New workspaces start with"
      desc="Applied once, when a workspace is made. Existing workspaces keep their own; owners change them after."
    >
      <SettingRow label="What leaves the server" hint="Ask stops every fetch, search and action">
        <Segmented
          value={defaults.approvalMode ?? WASHI_DEFAULTS.approvalMode}
          options={APPROVAL_MODE_OPTIONS}
          onChange={(approvalMode) => void onSave({ ...defaults, approvalMode })}
        />
      </SettingRow>
      <NumberRow
        label="Daily stop"
        hint="Metered dollars a day before Washi pauses"
        prefix="$"
        value={defaults.dailyCapUsd ?? WASHI_DEFAULTS.dailyCapUsd}
        onSave={(dailyCapUsd) => onSave({ ...defaults, dailyCapUsd })}
      />
      <NumberRow
        label="Turn cap"
        hint="Turns a day, priced or not"
        integer
        value={defaults.turnCap ?? WASHI_DEFAULTS.turnCap}
        onSave={(turnCap) => onSave({ ...defaults, turnCap })}
      />
    </SettingsCard>
  )
}
