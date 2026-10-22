import { useState } from 'react'
import { KeyDialog } from './key-dialog'
import { type KeyTarget, useAgentSettings } from './lib'
import { ModelCard } from './model-card'
import { OutsideCard } from './outside-card'
import { UsageCard } from './usage-card'

/** Three cards, each a question a person asks: what it thinks with, what can leave, what it costs. */
export function AgentTab() {
  const settings = useAgentSettings()
  const [dialog, setDialog] = useState<KeyTarget | null>(null)
  const { key, searchKey, spend, standing } = {
    key: settings.key,
    searchKey: settings.searchKey,
    spend: settings.spend,
    standing: settings.settings,
  }

  const connectedFor = (target: KeyTarget) =>
    target === 'exa' ? searchKey : key?.provider === target ? key : null

  return (
    <div className="grid gap-4">
      {settings.loading && <p className="text-[13px] text-muted-foreground">Loading…</p>}

      <ModelCard
        providerKey={key}
        models={settings.models}
        catalogueSource={settings.catalogueSource}
        effort={standing?.effort ?? 'balanced'}
        onConnect={setDialog}
        onRemove={settings.removeKey}
        onModel={settings.setModel}
        onEffort={settings.setDefaultEffort}
      />

      <OutsideCard
        approvalMode={settings.approvalMode}
        searchKey={searchKey}
        onApprovalMode={settings.setApprovalMode}
        onConnect={() => setDialog('exa')}
        onRemove={settings.removeSearchKey}
      />

      {spend && standing && (
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
