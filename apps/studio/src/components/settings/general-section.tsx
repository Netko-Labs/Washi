import { IconCheck, IconCopy } from '@tabler/icons-react'
import { getRouteApi } from '@tanstack/react-router'
import { useState } from 'react'
import { type GeneralSectionProps, useWorkspaceRename } from './lib'
import { NameField, SettingRow, SettingsCard } from './shared/card'

const workspaceRoute = getRouteApi('/w/$workspaceId')

/** The workspace's name, its ID, and where you stand in it. */
export function GeneralSection({ workspaceId }: GeneralSectionProps) {
  const { workspace } = workspaceRoute.useLoaderData()
  const name = useWorkspaceRename(workspaceId, workspace.name)
  const [isCopied, setCopied] = useState(false)
  const canRename = workspace.role === 'owner' || workspace.role === 'admin'

  const copy = () => {
    void navigator.clipboard.writeText(workspaceId).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    })
  }

  return (
    <SettingsCard title="Workspace" desc="One workspace is one team, one file of pages and data.">
      <NameField
        label="Name"
        field={name}
        disabled={!canRename}
        hint={
          canRename ? 'Everyone in the workspace sees it.' : 'Only an owner or admin renames it.'
        }
      />
      <SettingRow label="Workspace ID" hint="What an app admin or a support thread asks for.">
        <code className="max-w-[200px] truncate font-mono text-[12px] text-muted-foreground">
          {workspaceId}
        </code>
        <button
          type="button"
          onClick={copy}
          aria-label="Copy the workspace ID"
          className="grid size-7 place-items-center rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground"
        >
          {isCopied ? <IconCheck className="size-4" /> : <IconCopy className="size-4" />}
        </button>
      </SettingRow>
      <SettingRow label="Your role" hint="Owners steer Washi’s keys, approvals and the stop.">
        <span className="text-[13px] capitalize">{workspace.role}</span>
      </SettingRow>
    </SettingsCard>
  )
}
