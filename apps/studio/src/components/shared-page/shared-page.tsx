import { PaperProvider, SheetLookProvider, WsxView } from '@washi/paper'
import { AgentMascot } from '@washi/ui'
import { useMemo } from 'react'
import { type SharedPageProps, useSharedPage, useShareHost } from './lib'
import { shareLook } from './share-look'
import { SharedThemeSwitch } from './shared-theme-switch'
import { SharedTrail } from './shared-trail'

/**
 * A page through its read-only link (D65): no session, no sidebar, no Washi. What arrives was
 * redacted on the server; this only draws it. Its adds are suggestions, if it takes them (D120).
 * A link that opens its sub-pages draws a trail over them, and its links move between them (D123).
 */
export function SharedPage({ workspaceId, token, page: asked }: SharedPageProps) {
  const state = useSharedPage(workspaceId, token, asked)
  const page = state.status === 'ready' ? state.page : null
  const { host, open } = useShareHost(workspaceId, token, page)
  const look = useMemo(() => {
    const sub = page && page.id !== page.home.id ? page.id : undefined
    return shareLook(workspaceId, token, page?.theme ?? null, page?.unsplash ?? null, sub)
  }, [workspaceId, token, page])

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
        <span className="flex items-center gap-3">
          <span>{state.page.suggest ? 'Takes suggestions' : 'Read-only'}</span>
          <SharedThemeSwitch />
        </span>
      </header>
      <SharedTrail page={state.page} onOpen={open} />
      <SheetLookProvider value={look}>
        <PaperProvider host={host}>
          <WsxView key={`${state.page.id}:${state.page.hlcUpdated}`} root={state.root} />
        </PaperProvider>
      </SheetLookProvider>
    </main>
  )
}
