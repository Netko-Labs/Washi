import { getRouteApi } from '@tanstack/react-router'
import { useSession } from '@/integrations/auth'
import { type SharePanelProps, shareUrl, useShare } from './lib'
import { ShareAudience } from './share-audience'
import { ShareLink } from './share-link'
import { SharePeople } from './share-people'

const workspaceRoute = getRouteApi('/w/$workspaceId')
const LABEL =
  'px-2 pt-2 pb-1 font-semibold text-[11px] text-muted-foreground uppercase tracking-[0.06em]'

/** Notion's Share, Washi's rules (D65): who reads the page, and its read-only link. */
export function SharePanel({ sheet }: SharePanelProps) {
  const { workspace } = workspaceRoute.useLoaderData()
  const { data: session } = useSession()
  const share = useShare(sheet.id)
  const me = session?.user.id ?? null
  const settings = share.settings

  return (
    <div className="grid gap-1">
      <div className={LABEL}>Who can read</div>
      {settings ? (
        <ShareAudience
          value={settings.visibility}
          busy={share.busy}
          onChange={(visibility) => void share.apply(visibility, settings.access)}
        />
      ) : (
        <p className="px-2 py-3 text-[12.5px] text-muted-foreground">Loading…</p>
      )}
      {settings?.visibility === 'private' && (
        <>
          <div className={LABEL}>People</div>
          <SharePeople
            access={settings.access}
            me={me}
            busy={share.busy}
            onToggle={(id) =>
              void share.apply(
                'private',
                settings.access.includes(id)
                  ? settings.access.filter((entry) => entry !== id)
                  : [...settings.access, id],
              )
            }
          />
        </>
      )}
      {settings?.visibility === 'public' && settings.token && (
        <>
          <div className={LABEL}>Link</div>
          <div className="px-2 pb-1">
            <ShareLink url={shareUrl(workspace.id, settings.token)} hidden={settings.hidden} />
          </div>
        </>
      )}
      {share.error && <p className="px-2 pb-1 text-[12px] text-destructive">{share.error}</p>}
    </div>
  )
}
