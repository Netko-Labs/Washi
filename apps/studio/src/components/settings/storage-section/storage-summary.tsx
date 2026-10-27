import { sinceLabel } from '../lib'
import { SettingRow, SettingsCard } from '../shared/card'
import { placeOf, STORAGE_COPY, type StorageSummaryProps } from './lib'
import { StorageRemove } from './storage-remove'

/** Where new uploads land now, and what the bucket is, without its secret. */
export function StorageSummary({ state, canEdit, onRemove }: StorageSummaryProps) {
  const { config } = state

  return (
    <SettingsCard
      title="Where uploads go"
      desc={STORAGE_COPY.stays}
      tag={config ? { label: 'Your bucket', tone: 'ok' } : undefined}
    >
      {config ? (
        <>
          <SettingRow label={placeOf(config)} hint={STORAGE_COPY.ownHint}>
            {canEdit && <StorageRemove onRemove={onRemove} />}
          </SettingRow>
          <SettingRow label="Endpoint">
            <code className="max-w-[260px] truncate font-mono text-[12px]">{config.endpoint}</code>
          </SettingRow>
          <SettingRow label="Region">
            <span className="text-[13px]">{config.region}</span>
          </SettingRow>
          <SettingRow
            label="Access key ID"
            hint={`Set${config.updatedBy ? ` by ${config.updatedBy}` : ''} ${sinceLabel(config.updatedAt)}. The secret never leaves the server.`}
          >
            <code className="font-mono text-[12px]">••••{config.accessKeyLast4}</code>
          </SettingRow>
        </>
      ) : (
        <SettingRow label="The server’s store" hint={STORAGE_COPY.serverHint}>
          <span className="text-[13px] text-muted-foreground">Default</span>
        </SettingRow>
      )}
      {!canEdit && (
        <p className="border-border border-t px-4 py-3 text-[12px] text-muted-foreground">
          {STORAGE_COPY.membersOnly}
        </p>
      )}
    </SettingsCard>
  )
}
