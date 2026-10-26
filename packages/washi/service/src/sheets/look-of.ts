import type { SheetAccess, SheetLook } from '@washi/domain'
import type { WsxElement } from '@washi/wsx'

/** A page's icon and cover are its `<Sheet>` props (D64); the columns only cache them. */
export function lookOf(root: WsxElement): SheetLook {
  const read = (name: string) => {
    const value = root.props[name]
    return typeof value === 'string' ? value : null
  }
  return { icon: read('icon'), cover: read('cover') }
}

export function withLook(root: WsxElement, look: Partial<SheetLook>): WsxElement {
  const props = { ...root.props }
  for (const [name, value] of Object.entries(look)) {
    if (value === undefined) continue
    if (value === null) delete props[name]
    else props[name] = value
  }
  return { ...root, props }
}

/** Who reads a page is the page's own too (D65): `<Sheet visibility access>`, cached like the look. */
export function accessOf(root: WsxElement): SheetAccess {
  const visibility = root.props.visibility
  const access = root.props.access
  return {
    visibility: visibility === 'private' || visibility === 'public' ? visibility : 'shared',
    access: Array.isArray(access)
      ? access.filter((id): id is string => typeof id === 'string')
      : [],
  }
}
