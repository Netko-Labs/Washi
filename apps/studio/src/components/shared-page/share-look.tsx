import type { SheetLookHost } from '@washi/paper'
import type { ThemePair } from '@washi/paper/registry'
import { base, pageQuery, type SharedPayload } from './lib'

/** The link lends paper its pictures and the page's own uploads; nothing changes from here. */
export function shareLook(
  workspaceId: string,
  token: string,
  theme: ThemePair | null,
  photo: SharedPayload['unsplash'],
  page?: string,
): Omit<SheetLookHost, 'band'> {
  // A sub-page's own uploads are asked for as that page's (D123).
  const fileUrl = (id: string) =>
    `${base(workspaceId, token)}/file/${encodeURIComponent(id)}${pageQuery(page)}`
  return {
    pictureUrl: (slug) => `/covers/${slug}.jpg`,
    fileUrl,
    drawIcon: (name) =>
      name.startsWith('file:') ? <img src={fileUrl(name.slice(5))} alt="" /> : null,
    theme: () => theme ?? undefined,
    unsplash: (id) => (photo?.id === id ? photo : undefined),
  }
}
