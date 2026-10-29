import {
  EFFORT_OPTIONS,
  type ModelCardProps,
  PROVIDER_META,
  PROVIDERS,
  type ProviderId,
} from '../lib'
import { ModelMenu } from '../model-menu'
import { ProviderRow, Segmented, SettingRow, SettingsCard } from '../shared/card'

/** One key for the workspace: a row per provider, then what every conversation starts with. */
export function ModelCard({
  providerKey,
  serverKey,
  models,
  catalogueSource,
  effort,
  onConnect,
  onRemove,
  onModel,
  onEffort,
}: ModelCardProps) {
  return (
    <SettingsCard
      title="Model"
      desc="One key for the whole workspace. Nobody on the team needs their own."
      tag={
        providerKey
          ? { label: 'Connected', tone: 'ok' }
          : serverKey
            ? { label: 'On the server’s key', tone: 'ok' }
            : { label: 'Asleep · no key', tone: 'off' }
      }
    >
      {!providerKey && serverKey && (
        <p className="px-5 py-4 text-[13px] text-muted-foreground">
          Washi runs on this server’s {PROVIDER_META[serverKey.provider as ProviderId]?.label} key
          until the workspace connects its own, which then wins.
        </p>
      )}
      {PROVIDERS.map((provider) => (
        <ProviderRow
          key={provider.id}
          meta={PROVIDER_META[provider.id]}
          connected={providerKey?.provider === provider.id ? providerKey : null}
          onConnect={() => onConnect(provider.id)}
          onRemove={() => void onRemove()}
        />
      ))}
      {providerKey && (
        <SettingRow
          label="Default model"
          hint="What a new conversation and every routine start with"
        >
          <ModelMenu
            models={models}
            provider={providerKey.provider}
            value={providerKey.model}
            catalogueSource={catalogueSource}
            onPick={(id) => void onModel(id)}
          />
        </SettingRow>
      )}
      <SettingRow
        label="Default effort"
        hint="Quick · Balanced · Deep — a conversation can change its own"
      >
        <Segmented
          value={effort}
          options={EFFORT_OPTIONS}
          onChange={(next) => void onEffort(next)}
        />
      </SettingRow>
    </SettingsCard>
  )
}
