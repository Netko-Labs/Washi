import type { SheetLookHost } from '@washi/paper'
import type { ThemePair } from '@washi/paper/registry'
import { base } from './lib'

/** The link lends paper its pictures and the page's own uploads; nothing changes from here. */
export function shareLook(
  workspaceId: string,
  token: string,
  theme: ThemePair | null,
): Omit<SheetLookHost, 'band'> {
  const fileUrl = (id: string) => `${base(workspaceId, token)}/file/${encodeURIComponent(id)}`
  return {
    pictureUrl: (slug) => `/covers/${slug}.jpg`,
    fileUrl,
    drawIcon: (name) =>
      name.startsWith('file:') ? <img src={fileUrl(name.slice(5))} alt="" /> : null,
    theme: () => theme ?? undefined,
  }
}
