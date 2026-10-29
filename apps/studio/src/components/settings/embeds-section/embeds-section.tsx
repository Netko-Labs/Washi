import { IconX } from '@tabler/icons-react'
import { EMBED_PROVIDERS } from '@washi/paper/registry'
import { useState } from 'react'
import { SettingsCard } from '../shared/card'
import { useIsSteward } from '../shared/stewardship'
import { useEmbedHosts } from './lib'

/** What a page may put in a frame: the built-ins always, these sites once an owner lists them. */
export function EmbedsSection() {
  const { hosts, widgets, server, error, save, allowWidgets } = useEmbedHosts()
  const isSteward = useIsSteward()
  const [draft, setDraft] = useState('')
  const add = async () => {
    if (draft.trim() && (await save([...hosts, draft]))) setDraft('')
  }

  return (
    <div className="grid gap-4">
      <SettingsCard
        title="Built in"
        desc="Every workspace may embed these, and the sites this server allows. Plain http never plays."
      >
        <ul className="flex flex-wrap gap-1.5 px-4 py-3">
          {EMBED_PROVIDERS.map((provider) => (
            <li
              key={provider.name}
              className="rounded-full bg-muted px-2.5 py-1 text-[12.5px] text-muted-foreground"
            >
              {provider.name}
            </li>
          ))}
          {server.hosts.map((host) => (
            <li
              key={host}
              className="rounded-full bg-muted px-2.5 py-1 font-mono text-[12.5px] text-muted-foreground"
            >
              {host}
            </li>
          ))}
        </ul>
      </SettingsCard>
      <SettingsCard
        title="This workspace’s sites"
        desc={
          isSteward
            ? 'Any other site a page embeds plays only from here; the rest show as a link.'
            : 'An owner or admin adds sites here; until then other embeds show as a link.'
        }
      >
        {hosts.length > 0 && (
          <ul className="flex flex-wrap gap-1.5 px-4 pt-3">
            {hosts.map((host) => (
              <li
                key={host}
                className="flex items-center gap-1 rounded-full border border-border py-0.5 pr-1 pl-2.5 font-mono text-[12.5px]"
              >
                {host}
                {isSteward && (
                  <button
                    type="button"
                    aria-label={`Stop embedding ${host}`}
                    onClick={() => void save(hosts.filter((each) => each !== host))}
                    className="grid size-5 place-items-center rounded-full text-muted-foreground hover:bg-accent hover:text-destructive"
                  >
                    <IconX className="size-3" />
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
        {isSteward && (
          <form
            className="flex gap-2 px-4 py-3"
            onSubmit={(event) => {
              event.preventDefault()
              void add()
            }}
          >
            <input
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              placeholder="docs.example.com"
              aria-label="A site to allow"
              className="h-9 min-w-0 flex-1 rounded-xl border border-border bg-background px-3 font-mono text-[13px] outline-none focus-visible:border-primary"
            />
            <button
              type="submit"
              disabled={!draft.trim()}
              className="h-9 shrink-0 rounded-xl border border-border px-4 font-semibold text-[13px] hover:bg-accent disabled:opacity-50"
            >
              Allow
            </button>
          </form>
        )}
        {error && (
          <p className="border-border border-t px-4 py-3 text-[13px] text-destructive">{error}</p>
        )}
      </SettingsCard>
      <SettingsCard
        title="Widgets"
        desc="A widget is a page’s own HTML and JavaScript, run in a frame with no network and no reach but the page’s. Off, a widget shows as a note."
        tag={
          !server.widgets
            ? { tone: 'off', label: 'Off · by the server' }
            : widgets
              ? { tone: 'ok', label: 'On' }
              : { tone: 'off', label: 'Off' }
        }
      >
        <div className="flex items-center justify-between gap-3 px-4 py-3">
          <p className="text-[13px] text-muted-foreground">
            {!server.widgets
              ? 'This server keeps widgets off for every workspace. Its admin can change that.'
              : widgets
                ? 'Pages in this workspace run their widgets.'
                : 'No page in this workspace runs a widget.'}
          </p>
          {isSteward && server.widgets && (
            <button
              type="button"
              onClick={() => void allowWidgets(!widgets)}
              className="h-9 shrink-0 rounded-xl border border-border px-4 font-semibold text-[13px] hover:bg-accent"
            >
              {widgets ? 'Turn off' : 'Allow widgets'}
            </button>
          )}
        </div>
      </SettingsCard>
    </div>
  )
}
