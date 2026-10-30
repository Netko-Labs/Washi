import { CommandPalette, MascotDefs, Notice } from '@washi/ui'
import { RowPeek } from '@/components/row-peek'
import { useIsNarrow } from '@/components/shared/viewport'
import { PALETTE_LINKS, useTabNavigation, useWorkspaceBoot, type WorkspaceShellProps } from './lib'
import { NarrowShell } from './narrow-shell'
import { SkipLink } from './skip-link'
import { WideShell } from './wide-shell'

/** The shell on the web: Sidebar D wide, the Home screen narrow (D59). No tab strip (D58) — a page is its URL. */
export function WorkspaceShell({ workspace, children }: WorkspaceShellProps) {
  useWorkspaceBoot(workspace.id)
  useTabNavigation(workspace.id)
  const Shell = useIsNarrow() ? NarrowShell : WideShell

  return (
    <div className="flex h-dvh overflow-hidden pt-[env(safe-area-inset-top)] bg-background font-sans text-[14px] text-foreground">
      <SkipLink />
      <MascotDefs />
      <Shell workspace={workspace}>{children}</Shell>
      <RowPeek workspaceId={workspace.id} />
      <CommandPalette links={PALETTE_LINKS} />
      <Notice />
    </div>
  )
}
