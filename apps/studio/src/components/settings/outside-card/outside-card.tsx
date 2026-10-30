import {
  APPROVAL_MODE_OPTIONS,
  ON_SERVER_SEARCH_KEY,
  ON_SERVER_UNSPLASH_KEY,
  type OutsideCardProps,
  PROVIDER_META,
  YOLO_OPTIONS,
} from '../lib'
import { ProviderRow, Segmented, SettingRow, SettingsCard } from '../shared/card'

const NOTE = 'border-border border-t px-5 py-4 text-[13px] text-muted-foreground'

/** Reads pass and page edits land either way. This card is about the outside. */
export function OutsideCard({
  approvalMode,
  searchKey,
  unsplashKey,
  lent,
  onApprovalMode,
  yoloAllowed,
  onYoloAllowed,
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
      <SettingRow
        label="Let people approve everything in a conversation"
        hint="A YOLO switch in the composer: Washi stops asking in that conversation only. Off turns every one back"
      >
        <Segmented
          value={yoloAllowed ? 'on' : 'off'}
          options={YOLO_OPTIONS}
          onChange={(choice) => void onYoloAllowed(choice === 'on')}
        />
      </SettingRow>
      {!searchKey && lent.exa && <p className={NOTE}>{ON_SERVER_SEARCH_KEY}</p>}
      <ProviderRow
        meta={PROVIDER_META.exa}
        connected={searchKey}
        onConnect={() => onConnect('exa')}
        onRemove={() => void onRemove('exa')}
      />
      {!unsplashKey && lent.unsplash && <p className={NOTE}>{ON_SERVER_UNSPLASH_KEY}</p>}
      <ProviderRow
        meta={PROVIDER_META.unsplash}
        connected={unsplashKey}
        onConnect={() => onConnect('unsplash')}
        onRemove={() => void onRemove('unsplash')}
      />
    </SettingsCard>
  )
}
