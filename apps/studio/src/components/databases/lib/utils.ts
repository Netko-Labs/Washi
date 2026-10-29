import { parse, type WsxElement } from '@washi/wsx'

/** A table no page shows, drawn as paper draws it on a page: the Database primitive alone. */
export function databaseRoot(name: string): WsxElement {
  return parse(
    `<Sheet title=${JSON.stringify(name)}><Database table=${JSON.stringify(name)} /></Sheet>`,
  )
}

export function sizeLabel(rows: number, columns: number): string {
  return `${rows} row${rows === 1 ? '' : 's'} · ${columns} column${columns === 1 ? '' : 's'}`
}
