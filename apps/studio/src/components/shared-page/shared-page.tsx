import { PaperProvider, SheetLookProvider, WsxView } from '@washi/paper'
import { AgentMascot } from '@washi/ui'
import { useMemo } from 'react'
import { type SharedPageProps, shareHost, useSharedPage } from './lib'
import { shareLook } from './share-look'

/**
 * A page through its read-only link (D65): no session, no sidebar, no Washi. What arrives was
 * redacted on the server; this only draws it. Its adds are suggestions, if it takes them (D120).
 */
export function SharedPage({ workspaceId, token }: SharedPageProps) {
  const state = useSharedPage(workspaceId, token)
  const page = state.status === 'ready' ? state.page : null
  const embedsAnySite = page?.embedsAnySite ?? false
  const suggest = page?.suggest ?? false
  const host = useMemo(
    () => shareHost(workspaceId, token, { embedsAnySite, suggest }),
    [workspaceId, token, embedsAnySite, suggest],
  )
  const look = useMemo(
    () => shareLook(workspaceId, token, page?.theme ?? null, page?.unsplash ?? null),
    [workspaceId, token, page],
  )

  if (state.status === 'loading') return <main className="min-h-dvh bg-background" />
  if (state.status === 'gone') {
    return (
      <main className="grid min-h-dvh place-items-center bg-background px-6 text-center">
        <div>
          <AgentMascot state="resting" size={56} className="mx-auto" />
          <h1 className="mt-4 font-semibold text-[20px]">This link does not open anything</h1>
          <p className="mt-2 text-[14px] text-muted-foreground">
            It may have been turned off, or the page is no longer shared.
          </p>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-dvh bg-background" data-full-width={state.page.fullWidth || undefined}>
      <header className="flex h-11 items-center justify-between border-border border-b px-4 text-[12.5px] text-muted-foreground">
        <span className="flex items-center gap-2">
          <AgentMascot state="idle" size={20} />
          Shared from Washi
        </span>
        <span>{state.page.suggest ? 'Takes suggestions' : 'Read-only'}</span>
      </header>
      <SheetLookProvider value={look}>
        <PaperProvider host={host}>
          <WsxView key={state.page.hlcUpdated} root={state.root} />
        </PaperProvider>
      </SheetLookProvider>
    </main>
  )
}
