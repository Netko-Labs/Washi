import { HostListCard } from '../../server-settings'
import { useIsSteward } from '../../shared/stewardship'
import { useWidgetHosts } from './lib'

/** What this workspace's widgets may reach; an owner or admin edits it, members read it. */
export function WidgetHostsCard() {
  const { hosts, save } = useWidgetHosts()
  const isSteward = useIsSteward()
  return <HostListCard kind="workspaceWidget" hosts={hosts} onSave={save} isEditable={isSteward} />
}
