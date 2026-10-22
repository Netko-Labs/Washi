import { APPROVAL_MODE_OPTIONS, type OutsideCardProps, PROVIDER_META } from '../lib'
import { ProviderRow } from '../model-card/provider-row'
import { Segmented, SettingRow, SettingsCard } from '../shared/card'

/** Reads pass and page edits land either way. This card is about the outside. */
export function OutsideCard({
  approvalMode,
  searchKey,
  onApprovalMode,
  onConnect,
  onRemove,
}: OutsideCardProps) {
  return (
    <SettingsCard
      title="What leaves the server"
      desc="Reads pass and page edits land either way. This is about the outside."
    >
      <SettingRow
        label="Approvals"
        hint="Ask stops every fetch, search and action at the desk; Auto is a standing yes, ledgered"
      >
        <Segmented
          value={approvalMode}
          options={APPROVAL_MODE_OPTIONS}
          onChange={(mode) => void onApprovalMode(mode)}
        />
      </SettingRow>
      <ProviderRow
        meta={PROVIDER_META.exa}
        connected={searchKey}
        onConnect={onConnect}
        onRemove={() => void onRemove()}
      />
    </SettingsCard>
  )
}
