import { useState } from 'react'
import { EnabledModelsCard } from './enabled-models-card'
import { KeyDialog } from './key-dialog'
import { type AgentTabProps, type KeyTarget, type ProviderId, useAgentSettings } from './lib'
import { ModelCard } from './model-card'
import { OutsideCard } from './outside-card'
import { UsageCard } from './usage-card'

/** Washi's three sections: what it thinks with, what can leave, what it costs. */
export function AgentTab({ part }: AgentTabProps) {
  const settings = useAgentSettings()
  const [dialog, setDialog] = useState<KeyTarget | null>(null)
  const { key, searchKey, spend, settings: standing } = settings

  const connectedFor = (target: KeyTarget) =>
    target === 'exa' ? searchKey : key?.provider === target ? key : null

  return (
    <div className="grid gap-9">
      {settings.loading && <p className="text-[13px] text-muted-foreground">Loading…</p>}

      {part === 'models' && (
        <>
          <ModelCard
            providerKey={key}
            serverKey={settings.serverKey}
            models={settings.models}
            catalogueSource={settings.catalogueSource}
            effort={standing?.effort ?? 'balanced'}
            onConnect={setDialog}
            onRemove={settings.removeKey}
            onModel={settings.setModel}
            onEffort={settings.setDefaultEffort}
          />
          {standing && (
            <EnabledModelsCard
              models={settings.models}
              provider={(key?.provider as ProviderId | undefined) ?? null}
              enabled={standing.enabledModels}
              onChange={settings.setEnabledModels}
            />
          )}
        </>
      )}

      {part === 'outside' && (
        <OutsideCard
          approvalMode={settings.approvalMode}
          searchKey={searchKey}
          serverSearchKey={settings.serverSearchKey}
          onApprovalMode={settings.setApprovalMode}
          yoloAllowed={standing?.yoloAllowed ?? false}
          onYoloAllowed={settings.setYoloAllowed}
          onConnect={() => setDialog('exa')}
          onRemove={settings.removeSearchKey}
        />
      )}

      {part === 'usage' && spend && standing && (
        <UsageCard
          spend={spend}
          settings={standing}
          onDailyCap={settings.setDailyCap}
          onTurnCap={settings.setTurnCap}
          onResumeBy={settings.setResumeBy}
          onPause={settings.pause}
          onResume={settings.resume}
        />
      )}

      {settings.error && <p className="text-[13px] text-destructive">{settings.error}</p>}

      {dialog && (
        <KeyDialog
          target={dialog}
          connected={connectedFor(dialog)}
          onSave={(secret) => settings.connect(dialog, secret)}
          onRemove={dialog === 'exa' ? settings.removeSearchKey : settings.removeKey}
          onClose={() => setDialog(null)}
        />
      )}
    </div>
  )
}
