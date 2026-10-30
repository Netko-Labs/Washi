import { SIGNUP_OPTIONS } from './lib'
import {
  CodeLimitsCard,
  HostListCard,
  PagePackagesCard,
  SafeguardsCard,
  ServerKeyCard,
  ServerLentKeyCard,
  ServerWidgetsCard,
  useServerSettings,
  WorkspaceDefaultsCard,
} from './server-settings'
import { Segmented, SettingRow, SettingsCard } from './shared/card'

/** The server's own settings, not this workspace's: only its app admins see them. */
export function ServerTab() {
  const server = useServerSettings()
  const { settings, error } = server
  const chosen = SIGNUP_OPTIONS.find((option) => option.id === settings?.signup)
  const changeOf = (which: string) => settings?.safeguardLog.find((each) => each.which === which)

  return (
    <div className="grid gap-9">
      {!settings && !error && <p className="text-[13px] text-muted-foreground">Loading…</p>}
      {settings && (
        <>
          <SettingsCard
            title="Who can create an account"
            desc="Applies to every workspace on this server."
          >
            <SettingRow label="Sign-up" hint={chosen?.desc}>
              <Segmented
                value={settings.signup}
                options={SIGNUP_OPTIONS}
                onChange={(mode) => void server.setSignup(mode)}
              />
            </SettingRow>
          </SettingsCard>
          <ServerKeyCard
            serverKey={settings.key}
            models={server.models}
            catalogueSource={server.catalogueSource}
            onSave={server.saveKey}
            onRemove={server.removeKey}
            onModel={server.setKeyModel}
          />
          <ServerLentKeyCard
            target="exa"
            connected={settings.searchKey}
            onSave={(key) => server.saveLentKey('exa', key)}
            onRemove={() => server.removeLentKey('exa')}
          />
          <ServerLentKeyCard
            target="unsplash"
            connected={settings.unsplashKey}
            onSave={(key) => server.saveLentKey('unsplash', key)}
            onRemove={() => server.removeLentKey('unsplash')}
          />
          <WorkspaceDefaultsCard defaults={settings.defaults} onSave={server.setDefaults} />
          <HostListCard
            kind="fetch"
            hosts={settings.fetchHosts}
            lastChange={changeOf('fetchHosts')}
            onSave={(hosts) => server.setHosts('fetch', hosts)}
          />
          <HostListCard
            kind="embed"
            hosts={settings.embedHosts}
            lastChange={changeOf('embedHosts')}
            onSave={(hosts) => server.setHosts('embed', hosts)}
          />
          <ServerWidgetsCard widgets={settings.widgets} onChange={server.setWidgets} />
          <PagePackagesCard
            packages={settings.pagePackages}
            onAdd={server.addPagePackage}
            onRemove={server.removePagePackage}
          />
          <HostListCard
            kind="widget"
            hosts={settings.widgetHosts}
            lastChange={changeOf('widgetHosts')}
            onSave={(hosts) => server.setHosts('widget', hosts)}
          />
          <SafeguardsCard
            safeguards={settings.safeguards}
            log={settings.safeguardLog}
            onChange={server.setSafeguard}
          />
          <CodeLimitsCard
            limits={settings.limits}
            lastChange={changeOf('limits')}
            onSave={server.setLimits}
          />
        </>
      )}
      {error && <p className="text-[13px] text-destructive">{error}</p>}
    </div>
  )
}
