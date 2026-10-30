import {
  APPROVAL_MODE_OPTIONS,
  ON_SERVER_SEARCH_KEY,
  ON_SERVER_UNSPLASH_KEY,
  type OutsideCardProps,
  PROVIDER_META,
  SERVER_APPROVES,
  sentToModel,
  YOLO_OPTIONS,
} from '../lib'
import { ProviderRow, Segmented, SettingRow, SettingsCard } from '../shared/card'

const NOTE = 'border-border border-t px-5 py-4 text-[13px] text-muted-foreground'

/** Reads pass and page edits land either way. This card is about the outside. */
export function OutsideCard({
  modelProvider,
  approvalMode,
  serverApproves,
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
      <p className="px-5 py-4 text-[13px]">{sentToModel(modelProvider)}</p>
      {serverApproves ? (
        <p className={NOTE}>{SERVER_APPROVES}</p>
      ) : (
        <>
          <SettingRow
            label="Approvals"
            hint="Ask holds every fetch, search and action until a person approves it (the desk); Auto is a standing yes, each call still logged (the ledger)"
          >
            {approvalMode === 'auto' && (
              <span className="max-w-[200px] text-right text-[12px] text-amber-800 leading-snug dark:text-amber-300">
                Washi fetches, searches and runs actions without asking.
              </span>
            )}
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
        </>
      )}
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
