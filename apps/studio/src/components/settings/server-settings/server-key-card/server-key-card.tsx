import { useState } from 'react'
import { KeyDialog } from '../../key-dialog'
import { PROVIDER_META, PROVIDERS, type ProviderId } from '../../lib'
import { ModelMenu } from '../../model-menu'
import { ProviderRow, SettingRow, SettingsCard } from '../../shared/card'
import type { ServerKeyCardProps } from '../lib'

/** The server's own key (D105): what a workspace without one runs Washi on. */
export function ServerKeyCard({
  serverKey,
  models,
  catalogueSource,
  onSave,
  onRemove,
  onModel,
}: ServerKeyCardProps) {
  const [dialog, setDialog] = useState<ProviderId | null>(null)

  return (
    <>
      <SettingsCard
        title="Model key"
        desc="Workspaces without a key of their own run Washi on this one. A workspace’s own key always wins."
        tag={
          serverKey
            ? { label: 'Lent to every workspace', tone: 'ok' }
            : { label: 'None', tone: 'off' }
        }
      >
        {PROVIDERS.map((provider) => (
          <ProviderRow
            key={provider.id}
            meta={PROVIDER_META[provider.id]}
            connected={serverKey?.provider === provider.id ? serverKey : null}
            onConnect={() => setDialog(provider.id)}
            onRemove={() => void onRemove()}
          />
        ))}
        {serverKey && (
          <SettingRow label="Default model" hint="For every workspace on this key">
            <ModelMenu
              models={models}
              provider={serverKey.provider}
              value={serverKey.model}
              catalogueSource={catalogueSource}
              onPick={(id) => void onModel(id)}
            />
          </SettingRow>
        )}
      </SettingsCard>
      {dialog && (
        <KeyDialog
          target={dialog}
          connected={serverKey?.provider === dialog ? serverKey : null}
          blurb="One key for every workspace on this server, encrypted on it"
          onSave={(key) => onSave(dialog, key)}
          onRemove={onRemove}
          onClose={() => setDialog(null)}
        />
      )}
    </>
  )
}
